import Types "../types/common";

module {
  public func newJob(
    id : Types.JobId,
    sessionId : Types.SessionId,
    items : [Types.AccountItem],
    now : Types.Timestamp,
  ) : Types.TransferJobInternal {
    let itemProgresses : [Types.ItemProgress] = items.map<Types.AccountItem, Types.ItemProgress>(
      func(item) {
        {
          itemId = item.id;
          itemName = item.name;
          itemType = item.itemType;
          status = #pending;
          progressPct = 0;
          errorMessage = null;
        };
      }
    );
    {
      id;
      sessionId;
      var items = itemProgresses;
      var status = #pending;
      createdAt = now;
      var updatedAt = now;
    };
  };

  public func toPublic(job : Types.TransferJobInternal) : Types.TransferJob {
    {
      id = job.id;
      sessionId = job.sessionId;
      items = job.items;
      status = job.status;
      createdAt = job.createdAt;
      updatedAt = job.updatedAt;
    };
  };

  public func updateJobStatus(
    job : Types.TransferJobInternal,
    status : Types.JobStatus,
    now : Types.Timestamp,
  ) {
    job.status := status;
    job.updatedAt := now;
  };

  public func updateItemProgress(
    job : Types.TransferJobInternal,
    itemId : Types.ItemId,
    status : Types.JobStatus,
    progressPct : Nat,
    errorMessage : ?Text,
    now : Types.Timestamp,
  ) {
    job.items := job.items.map<Types.ItemProgress, Types.ItemProgress>(
      func(p) {
        if (p.itemId == itemId) {
          { p with status; progressPct; errorMessage };
        } else { p };
      }
    );
    job.updatedAt := now;
  };
}
