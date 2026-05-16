import Types "../types/common";

module {
  let emptyAuth : Types.AuthState = { phone = ""; verified = false; sessionString = "" };

  public func newSession(id : Types.SessionId, now : Types.Timestamp) : Types.SessionInternal {
    {
      id;
      var accountA = emptyAuth;
      var accountB = emptyAuth;
      var step = 1;
      createdAt = now;
      var updatedAt = now;
    };
  };

  public func toPublic(s : Types.SessionInternal) : Types.Session {
    {
      id = s.id;
      accountA = s.accountA;
      accountB = s.accountB;
      step = s.step;
      createdAt = s.createdAt;
      updatedAt = s.updatedAt;
    };
  };

  public func updateStep(s : Types.SessionInternal, step : Types.WizardStep, now : Types.Timestamp) {
    s.step := step;
    s.updatedAt := now;
  };

  public func updateAccountA(s : Types.SessionInternal, auth : Types.AuthState, now : Types.Timestamp) {
    s.accountA := auth;
    s.updatedAt := now;
  };

  public func updateAccountB(s : Types.SessionInternal, auth : Types.AuthState, now : Types.Timestamp) {
    s.accountB := auth;
    s.updatedAt := now;
  };
}
