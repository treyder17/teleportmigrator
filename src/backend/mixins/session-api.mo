import Map "mo:core/Map";
import Time "mo:core/Time";
import SessionLib "../lib/session";
import Types "../types/common";

mixin (
  sessions : Map.Map<Types.SessionId, Types.SessionInternal>,
  sessionState : { var nextSessionId : Nat },
) {
  /// Create a new migration session and return its id.
  public func createSession() : async Types.SessionId {
    let now = Time.now();
    let id = now.toText() # "-" # sessionState.nextSessionId.toText();
    sessionState.nextSessionId += 1;
    let session = SessionLib.newSession(id, now);
    sessions.add(id, session);
    id;
  };

  /// Retrieve a session by id.
  public query func getSession(sessionId : Types.SessionId) : async ?Types.Session {
    switch (sessions.get(sessionId)) {
      case (?s) { ?SessionLib.toPublic(s) };
      case null { null };
    };
  };

  /// Update the wizard step for a session (1–5).
  public func setWizardStep(sessionId : Types.SessionId, step : Types.WizardStep) : async Bool {
    switch (sessions.get(sessionId)) {
      case (?s) { SessionLib.updateStep(s, step, Time.now()); true };
      case null { false };
    };
  };

  /// Update Account A auth state.
  public func setAccountAAuth(sessionId : Types.SessionId, auth : Types.AuthState) : async Bool {
    switch (sessions.get(sessionId)) {
      case (?s) { SessionLib.updateAccountA(s, auth, Time.now()); true };
      case null { false };
    };
  };

  /// Update Account B auth state.
  public func setAccountBAuth(sessionId : Types.SessionId, auth : Types.AuthState) : async Bool {
    switch (sessions.get(sessionId)) {
      case (?s) { SessionLib.updateAccountB(s, auth, Time.now()); true };
      case null { false };
    };
  };
}
