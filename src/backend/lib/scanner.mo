import Types "../types/common";

module {
  /// Returns a pre-seeded realistic mock list of Telegram account items.
  public func mockScan() : [Types.AccountItem] {
    [
      // Direct message chats
      { id = "chat-001"; name = "Alex Johnson";      itemType = #chat;    memberCount = 2;      subscriberCount = 0;      selected = false },
      { id = "chat-002"; name = "Maria Garcia";      itemType = #chat;    memberCount = 2;      subscriberCount = 0;      selected = false },
      { id = "chat-003"; name = "David Kim";          itemType = #chat;    memberCount = 2;      subscriberCount = 0;      selected = false },
      { id = "chat-004"; name = "Sophie Turner";     itemType = #chat;    memberCount = 2;      subscriberCount = 0;      selected = false },
      { id = "chat-005"; name = "James Williams";    itemType = #chat;    memberCount = 2;      subscriberCount = 0;      selected = false },
      // Channels
      { id = "chan-001"; name = "TechNews Daily";     itemType = #channel; memberCount = 0;      subscriberCount = 128400; selected = false },
      { id = "chan-002"; name = "Crypto Signals";     itemType = #channel; memberCount = 0;      subscriberCount = 84200;  selected = false },
      { id = "chan-003"; name = "Design Inspiration"; itemType = #channel; memberCount = 0;      subscriberCount = 52100;  selected = false },
      { id = "chan-004"; name = "Dev Weekly";          itemType = #channel; memberCount = 0;      subscriberCount = 33700;  selected = false },
      { id = "chan-005"; name = "AI Research Hub";    itemType = #channel; memberCount = 0;      subscriberCount = 21900;  selected = false },
      // Groups
      { id = "grp-001"; name = "Developer Hub";       itemType = #group;   memberCount = 4820;   subscriberCount = 0;      selected = false },
      { id = "grp-002"; name = "Marketing Team";      itemType = #group;   memberCount = 38;     subscriberCount = 0;      selected = false },
      { id = "grp-003"; name = "Book Club";            itemType = #group;   memberCount = 14;     subscriberCount = 0;      selected = false },
      { id = "grp-004"; name = "Startup Founders";    itemType = #group;   memberCount = 256;    subscriberCount = 0;      selected = false },
      { id = "grp-005"; name = "Photography Lovers"; itemType = #group;   memberCount = 1340;   subscriberCount = 0;      selected = false },
      // Folders
      { id = "fld-001"; name = "Important";            itemType = #folder;  memberCount = 0;      subscriberCount = 0;      selected = false },
      { id = "fld-002"; name = "Work";                 itemType = #folder;  memberCount = 0;      subscriberCount = 0;      selected = false },
      { id = "fld-003"; name = "Personal";             itemType = #folder;  memberCount = 0;      subscriberCount = 0;      selected = false },
      // Bots
      { id = "bot-001"; name = "@NewsBot";             itemType = #bot;     memberCount = 0;      subscriberCount = 0;      selected = false },
      { id = "bot-002"; name = "@ReminderBot";         itemType = #bot;     memberCount = 0;      subscriberCount = 0;      selected = false },
      { id = "bot-003"; name = "@WeatherBot";          itemType = #bot;     memberCount = 0;      subscriberCount = 0;      selected = false },
      { id = "bot-004"; name = "@TranslateBot";        itemType = #bot;     memberCount = 0;      subscriberCount = 0;      selected = false },
    ];
  };
}
