import Map "mo:core/Map";
import Time "mo:core/Time";
import TransferLib "../lib/transfer";
import Types "../types/common";

mixin (
  sessions : Map.Map<Types.SessionId, Types.SessionInternal>,
  scannedItems : Map.Map<Types.SessionId, [Types.AccountItem]>,
  jobs : Map.Map<Types.JobId, Types.TransferJobInternal>,
  logs : Map.Map<Types.SessionId, [Types.LogEntry]>,
  state : { var nextJobId : Nat },
) {
  /// Create a transfer job for the selected items in a session.
  public func createTransferJob(sessionId : Types.SessionId) : async ?Types.JobId {
    switch (scannedItems.get(sessionId)) {
      case null { null };
      case (?items) {
        let selected = items.filter(func(item : Types.AccountItem) : Bool { item.selected });
        if (selected.size() == 0) { return null };
        let now = Time.now();
        let jobId = sessionId # "-job-" # state.nextJobId.toText();
        state.nextJobId += 1;
        let job = TransferLib.newJob(jobId, sessionId, selected, now);
        jobs.add(jobId, job);
        ?jobId;
      };
    };
  };

  /// Update the overall status of a job.
  public func updateJobStatus(jobId : Types.JobId, status : Types.JobStatus) : async Bool {
    switch (jobs.get(jobId)) {
      case null { false };
      case (?job) { TransferLib.updateJobStatus(job, status, Time.now()); true };
    };
  };

  /// Update per-item progress within a job.
  public func updateItemProgress(
    jobId : Types.JobId,
    itemId : Types.ItemId,
    status : Types.JobStatus,
    progressPct : Nat,
    errorMessage : ?Text,
  ) : async Bool {
    switch (jobs.get(jobId)) {
      case null { false };
      case (?job) {
        TransferLib.updateItemProgress(job, itemId, status, progressPct, errorMessage, Time.now());
        true;
      };
    };
  };

  /// Retrieve a transfer job with current status.
  public query func getTransferJob(jobId : Types.JobId) : async ?Types.TransferJob {
    switch (jobs.get(jobId)) {
      case (?job) { ?TransferLib.toPublic(job) };
      case null { null };
    };
  };

  /// List all jobs for a session.
  public query func listTransferJobs(sessionId : Types.SessionId) : async [Types.TransferJob] {
    let matched = jobs.values().filter(func(j : Types.TransferJobInternal) : Bool {
      j.sessionId == sessionId;
    });
    matched.map<Types.TransferJobInternal, Types.TransferJob>(func(j) { TransferLib.toPublic(j) }).toArray();
  };

  /// Append a log entry for an item transfer.
  public func addLogEntry(sessionId : Types.SessionId, entry : Types.LogEntry) : async () {
    let existing = switch (logs.get(sessionId)) {
      case (?arr) { arr };
      case null { [] };
    };
    logs.add(sessionId, existing.concat([entry]));
  };

  /// Retrieve all log entries for a session.
  public query func getTransferLogs(sessionId : Types.SessionId) : async [Types.LogEntry] {
    switch (logs.get(sessionId)) {
      case (?arr) { arr };
      case null { [] };
    };
  };
}
