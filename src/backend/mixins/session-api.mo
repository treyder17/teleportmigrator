import Map "mo:core/Map";
import Time "mo:core/Time";
import SessionLib "../lib/session";
import Types "../types/common";
import Text "mo:core/Text";

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

  /// Record the phone number for the given account and mark as pending verification.
  /// account must be "A" or "B".
  public func sendCode(sessionId : Types.SessionId, phone : Text, account : Text) : async { #ok; #err : Text } {
    switch (sessions.get(sessionId)) {
      case null { #err("Session not found") };
      case (?s) {
        let auth : Types.AuthState = { phone; verified = false; sessionString = "" };
        if (account == "A") {
          SessionLib.updateAccountA(s, auth, Time.now());
          #ok;
        } else if (account == "B") {
          SessionLib.updateAccountB(s, auth, Time.now());
          #ok;
        } else {
          #err("account must be 'A' or 'B'");
        };
      };
    };
  };

  /// Verify the code for the given account. Accepts any non-empty code.
  /// Returns username and initials derived from the phone number.
  public func verifyCode(sessionId : Types.SessionId, phone : Text, code : Text, account : Text) : async { #ok : { username : Text; initials : Text }; #err : Text } {
    if (code == "") {
      return #err("Code must not be empty");
    };
    switch (sessions.get(sessionId)) {
      case null { #err("Session not found") };
      case (?s) {
        let auth : Types.AuthState = {
          phone;
          verified = true;
          sessionString = "session-" # phone # "-" # code;
        };
        if (account == "A") {
          SessionLib.updateAccountA(s, auth, Time.now());
        } else if (account == "B") {
          SessionLib.updateAccountB(s, auth, Time.now());
        } else {
          return #err("account must be 'A' or 'B'");
        };
        let username = "User_" # phone;
        let rawChars = phone.chars();
        let c0 = switch (rawChars.next()) { case (?c) c; case null ' ' };
        let c1 = switch (rawChars.next()) { case (?c) c; case null ' ' };
        let initials = Text.fromChar(c0) # Text.fromChar(c1);
        #ok({ username; initials });
      };
    };
  };
}
