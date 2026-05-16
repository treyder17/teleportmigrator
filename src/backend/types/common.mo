import Time "mo:core/Time";

module {
  public type SessionId = Text;
  public type ItemId = Text;
  public type JobId = Text;
  public type Timestamp = Int; // nanoseconds from Time.now()

  public type WizardStep = Nat; // 1–5

  public type AuthState = {
    phone : Text;
    verified : Bool;
    sessionString : Text;
  };

  public type ItemType = { #chat; #channel; #group; #folder; #bot };

  public type AccountItem = {
    id : ItemId;
    name : Text;
    itemType : ItemType;
    memberCount : Nat;
    subscriberCount : Nat;
    selected : Bool;
  };

  public type JobStatus = { #pending; #running; #complete; #failed };

  public type ItemProgress = {
    itemId : ItemId;
    itemName : Text;
    itemType : ItemType;
    status : JobStatus;
    progressPct : Nat; // 0–100
    errorMessage : ?Text;
  };

  public type TransferJob = {
    id : JobId;
    sessionId : SessionId;
    items : [ItemProgress];
    status : JobStatus;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  public type LogEntry = {
    itemId : ItemId;
    itemName : Text;
    itemType : ItemType;
    status : JobStatus;
    startTime : Timestamp;
    endTime : ?Timestamp;
    errorMessage : ?Text;
  };

  public type Session = {
    id : SessionId;
    accountA : AuthState;
    accountB : AuthState;
    step : WizardStep;
    createdAt : Timestamp;
    updatedAt : Timestamp;
  };

  // Mutable internal session (var fields)
  public type SessionInternal = {
    id : SessionId;
    var accountA : AuthState;
    var accountB : AuthState;
    var step : WizardStep;
    createdAt : Timestamp;
    var updatedAt : Timestamp;
  };

  // Mutable internal job (var fields)
  public type TransferJobInternal = {
    id : JobId;
    sessionId : SessionId;
    var items : [ItemProgress];
    var status : JobStatus;
    createdAt : Timestamp;
    var updatedAt : Timestamp;
  };
}
