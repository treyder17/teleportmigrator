import Map "mo:core/Map";
import Types "types/common";
import SessionMixin "mixins/session-api";
import ScannerMixin "mixins/scanner-api";
import TransferMixin "mixins/transfer-api";

actor {
  let sessions = Map.empty<Types.SessionId, Types.SessionInternal>();
  let scannedItems = Map.empty<Types.SessionId, [Types.AccountItem]>();
  let jobs = Map.empty<Types.JobId, Types.TransferJobInternal>();
  let logs = Map.empty<Types.SessionId, [Types.LogEntry]>();
  let state = { var nextJobId : Nat = 0; var nextSessionId : Nat = 0 };

  include SessionMixin(sessions, state);
  include ScannerMixin(sessions, scannedItems);
  include TransferMixin(sessions, scannedItems, jobs, logs, state);
}

