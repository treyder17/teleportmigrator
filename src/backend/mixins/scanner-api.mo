import Map "mo:core/Map";
import ScannerLib "../lib/scanner";
import Types "../types/common";

mixin (
  sessions : Map.Map<Types.SessionId, Types.SessionInternal>,
  scannedItems : Map.Map<Types.SessionId, [Types.AccountItem]>,
) {
  /// Trigger a mock scan for Account A and persist the results.
  /// Returns the list of discovered items.
  public func scanAccountA(sessionId : Types.SessionId) : async [Types.AccountItem] {
    switch (sessions.get(sessionId)) {
      case null { [] };
      case (?_s) {
        let items = ScannerLib.mockScan();
        scannedItems.add(sessionId, items);
        items;
      };
    };
  };

  /// Return persisted scanned items for a session.
  public query func getScannedItems(sessionId : Types.SessionId) : async [Types.AccountItem] {
    switch (scannedItems.get(sessionId)) {
      case (?items) { items };
      case null { [] };
    };
  };

  /// Toggle selection on a specific item.
  public func toggleItemSelection(sessionId : Types.SessionId, itemId : Types.ItemId) : async Bool {
    switch (scannedItems.get(sessionId)) {
      case null { false };
      case (?items) {
        let updated = items.map(
          func(item) {
            if (item.id == itemId) { { item with selected = not item.selected } } else { item };
          }
        );
        scannedItems.add(sessionId, updated);
        true;
      };
    };
  };

  /// Set all items selected or deselected.
  public func selectAllItems(sessionId : Types.SessionId, selected : Bool) : async Bool {
    switch (scannedItems.get(sessionId)) {
      case null { false };
      case (?items) {
        let updated = items.map(
          func(item) { { item with selected } }
        );
        scannedItems.add(sessionId, updated);
        true;
      };
    };
  };
}
