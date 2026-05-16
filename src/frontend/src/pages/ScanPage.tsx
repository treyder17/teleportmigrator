import { useWizard } from "@/hooks/useWizard";
import { cn } from "@/lib/utils";
import type { AccountItem, AccountItemType } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Folder,
  MessageCircle,
  Radio,
  RefreshCw,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// ------- Icons -------
const typeIcon: Record<AccountItemType, typeof Users> = {
  channel: Radio,
  group: Users,
  supergroup: Users,
  chat: MessageCircle,
  bot: Bot,
  folder: Folder,
};

const typeLabel: Record<AccountItemType, string> = {
  channel: "Channel",
  group: "Group",
  supergroup: "Supergroup",
  chat: "Chat",
  bot: "Bot",
  folder: "Folder",
};

const typeColor: Record<AccountItemType, string> = {
  channel: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  group: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  supergroup: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  chat: "text-violet-400 bg-violet-400/10 border-violet-400/20",
  bot: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  folder: "text-primary bg-primary/10 border-primary/20",
};

// ------- Mock data -------
const MOCK_ITEMS: AccountItem[] = [
  // Channels (5)
  {
    id: "c1",
    name: "Crypto Signals Alpha",
    type: "channel",
    subscriberCount: 42300,
    selected: false,
  },
  {
    id: "c2",
    name: "AI Research Feed",
    type: "channel",
    subscriberCount: 15600,
    selected: false,
  },
  {
    id: "c3",
    name: "Market Alerts Daily",
    type: "channel",
    subscriberCount: 9870,
    selected: false,
  },
  {
    id: "c4",
    name: "Tech News Global",
    type: "channel",
    subscriberCount: 78200,
    selected: false,
  },
  {
    id: "c5",
    name: "DeFi Insider",
    type: "channel",
    subscriberCount: 6540,
    selected: false,
  },
  // Groups (5)
  {
    id: "g1",
    name: "Dev Community Hub",
    type: "group",
    memberCount: 8900,
    selected: false,
  },
  {
    id: "g2",
    name: "Trading Desk Team",
    type: "group",
    memberCount: 245,
    selected: false,
  },
  {
    id: "g3",
    name: "Team Alpha",
    type: "group",
    memberCount: 38,
    selected: false,
  },
  {
    id: "g4",
    name: "Backend Engineers",
    type: "group",
    memberCount: 1240,
    selected: false,
  },
  {
    id: "g5",
    name: "Design System WG",
    type: "group",
    memberCount: 94,
    selected: false,
  },
  // Chats/DMs (5)
  { id: "d1", name: "Saved Messages", type: "chat", selected: false },
  { id: "d2", name: "Alex Petrov", type: "chat", selected: false },
  { id: "d3", name: "Maria Chen", type: "chat", selected: false },
  { id: "d4", name: "Support Team", type: "chat", selected: false },
  { id: "d5", name: "David Okafor", type: "chat", selected: false },
  // Folders (3)
  { id: "f1", name: "Work", type: "folder", selected: false },
  { id: "f2", name: "Finance", type: "folder", selected: false },
  { id: "f3", name: "Personal", type: "folder", selected: false },
  // Bots (4)
  { id: "b1", name: "@NewsBot Pro", type: "bot", selected: false },
  { id: "b2", name: "@PriceAlertBot", type: "bot", selected: false },
  { id: "b3", name: "@SchedulerBot", type: "bot", selected: false },
  { id: "b4", name: "@TranslatorBot", type: "bot", selected: false },
];

type FilterType = AccountItemType | "all";

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "chat", label: "Chats" },
  { value: "channel", label: "Channels" },
  { value: "group", label: "Groups" },
  { value: "folder", label: "Folders" },
  { value: "bot", label: "Bots" },
];

// ------- Component -------
export function ScanPage() {
  const {
    session,
    setScannedItems,
    toggleItemSelected,
    selectAllItems,
    setCurrentStep,
  } = useWizard();
  const navigate = useNavigate();

  const [scanning, setScanning] = useState(false);
  const [scanned, setScanned] = useState(session.scannedItems.length > 0);
  const [progress, setProgress] = useState(scanned ? 100 : 0);
  const [items, setItems] = useState<AccountItem[]>(
    session.scannedItems.length > 0 ? session.scannedItems : [],
  );
  const [filter, setFilter] = useState<FilterType>("all");
  const [scanPhase, setScanPhase] = useState("Initialising MTProto session...");
  const scanPhaseRef = useRef(0);

  const SCAN_PHASES = [
    "Initialising MTProto session...",
    "Connecting to Telegram servers...",
    "Fetching dialogs list...",
    "Loading channels and groups...",
    "Extracting folder structures...",
    "Discovering bots...",
    "Finalising results...",
  ];

  // Auto-scan on mount if not already scanned — intentionally run once
  // biome-ignore lint/correctness/useExhaustiveDependencies: run-once on mount
  useEffect(() => {
    if (!scanned && !scanning) {
      runScan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runScan = async () => {
    setScanning(true);
    setScanned(false);
    setProgress(0);
    scanPhaseRef.current = 0;

    const totalSteps = 40;
    const phaseSize = Math.floor(totalSteps / SCAN_PHASES.length);

    for (let step = 0; step <= totalSteps; step++) {
      await new Promise((r) => setTimeout(r, 50));
      const pct = Math.round((step / totalSteps) * 100);
      setProgress(pct);
      const phaseIdx = Math.min(
        Math.floor(step / phaseSize),
        SCAN_PHASES.length - 1,
      );
      if (phaseIdx !== scanPhaseRef.current) {
        scanPhaseRef.current = phaseIdx;
        setScanPhase(SCAN_PHASES[phaseIdx]);
      }
    }

    const result = MOCK_ITEMS.map((i) => ({ ...i, selected: false }));
    setItems(result);
    setScannedItems(result);
    setScanning(false);
    setScanned(true);
    setScanPhase("Scan complete");
  };

  // Derive selected IDs from context
  const selectedIds = new Set(session.selectedItems);

  const handleToggle = (id: string) => {
    toggleItemSelected(id);
    // Reflect locally for immediate feedback
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item,
      ),
    );
  };

  const allSelected =
    items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const someSelected = items.some((i) => selectedIds.has(i.id));

  const handleSelectAll = (checked: boolean) => {
    selectAllItems(checked);
    setItems((prev) => prev.map((i) => ({ ...i, selected: checked })));
  };

  const filteredItems =
    filter === "all" ? items : items.filter((i) => i.type === filter);

  const countByType = (type: AccountItemType) =>
    items.filter((i) => i.type === type).length;

  const selectedCount = session.selectedItems.length;

  const handleBack = () => {
    setCurrentStep("auth");
    navigate({ to: "/" });
  };
  const handleNext = () => {
    setCurrentStep("preview");
    navigate({ to: "/preview" });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-up">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="font-display font-semibold text-2xl text-foreground">
          Account Scanner
        </h2>
        <p className="text-sm text-muted-foreground">
          Scanning Account A to discover all chats, channels, groups, folders,
          and bots available for migration.
        </p>
      </div>

      {/* Scan panel */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {scanning
                ? "Scanning Account A…"
                : scanned
                  ? `${items.length} items discovered`
                  : "Ready to scan"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {scanning
                ? scanPhase
                : scanned
                  ? "Scan complete. Filter and select items below."
                  : "Connects to Account A via MTProto and extracts all entities."}
            </p>
          </div>
          <button
            type="button"
            disabled={scanning}
            onClick={runScan}
            data-ocid="scan.start_button"
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-smooth flex-shrink-0",
              scanning
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary text-primary-foreground hover:opacity-90",
            )}
          >
            <RefreshCw
              className={cn("w-3.5 h-3.5", scanning && "animate-spin")}
            />
            {scanned ? "Re-scan" : "Start Scan"}
          </button>
        </div>

        {/* Progress bar */}
        {(scanning || scanned) && (
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>{scanning ? scanPhase : "Scanning Account A"}</span>
              <span>{progress}%</span>
            </div>
            <div
              className="h-2 rounded-full bg-muted overflow-hidden"
              data-ocid="scan.progress_bar"
            >
              <div
                className="h-full rounded-full bg-primary transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary stats */}
      {scanned && items.length > 0 && (
        <div
          className="grid grid-cols-3 sm:grid-cols-6 gap-2"
          data-ocid="scan.stats_panel"
        >
          {(
            [
              { type: "chat", label: "Chats", icon: MessageCircle },
              { type: "channel", label: "Channels", icon: Radio },
              { type: "group", label: "Groups", icon: Users },
              { type: "folder", label: "Folders", icon: Folder },
              { type: "bot", label: "Bots", icon: Bot },
            ] as { type: AccountItemType; label: string; icon: typeof Users }[]
          ).map(({ type, label, icon: Icon }) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter((f) => (f === type ? "all" : type))}
              data-ocid={`scan.stat.${type}`}
              className={cn(
                "rounded-lg border p-3 text-center cursor-pointer transition-smooth",
                filter === type
                  ? "border-primary/40 bg-primary/10"
                  : "border-border bg-card hover:border-muted-foreground/40",
              )}
            >
              <Icon
                className={cn(
                  "w-4 h-4 mx-auto mb-1",
                  filter === type ? "text-primary" : "text-muted-foreground",
                )}
              />
              <p className="text-lg font-display font-bold text-foreground leading-none">
                {countByType(type)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
            </button>
          ))}
          {/* Selected badge */}
          <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-center">
            <div className="w-4 h-4 mx-auto mb-1 rounded-sm border-2 border-primary flex items-center justify-center">
              {selectedCount > 0 && (
                <div className="w-2 h-2 rounded-sm bg-primary" />
              )}
            </div>
            <p className="text-lg font-display font-bold text-primary leading-none">
              {selectedCount}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Selected</p>
          </div>
        </div>
      )}

      {/* Results list */}
      {scanned && items.length > 0 && (
        <div className="space-y-3">
          {/* Filter tabs */}
          <div
            className="flex flex-wrap gap-1.5"
            role="tablist"
            data-ocid="scan.filter_tabs"
          >
            {FILTER_OPTIONS.map((f) => {
              const count =
                f.value === "all"
                  ? items.length
                  : items.filter((i) => i.type === f.value).length;
              return (
                <button
                  key={f.value}
                  type="button"
                  role="tab"
                  aria-selected={filter === f.value}
                  onClick={() => setFilter(f.value)}
                  data-ocid={`scan.filter.${f.value}`}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors duration-150 border flex items-center gap-1.5",
                    filter === f.value
                      ? "bg-primary/15 border-primary/30 text-primary"
                      : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/60",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "inline-flex items-center justify-center rounded-full text-[10px] font-mono w-4 h-4",
                      filter === f.value
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* List container */}
          <div
            className="rounded-xl border border-border bg-card overflow-hidden"
            data-ocid="scan.item_list"
          >
            {/* Select-all header */}
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border bg-muted/30">
              <button
                type="button"
                aria-label="Select all items"
                onClick={() => handleSelectAll(!allSelected)}
                data-ocid="scan.select_all_checkbox"
                className={cn(
                  "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-smooth",
                  allSelected
                    ? "bg-primary border-primary"
                    : someSelected
                      ? "border-primary bg-primary/30"
                      : "border-border hover:border-muted-foreground",
                )}
              >
                {allSelected && (
                  <svg
                    className="w-2.5 h-2.5 text-primary-foreground"
                    fill="none"
                    viewBox="0 0 12 12"
                    aria-hidden="true"
                  >
                    <path
                      d="M2 6l3 3 5-5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {someSelected && !allSelected && (
                  <div className="w-2 h-0.5 rounded bg-primary" />
                )}
              </button>
              <span className="text-xs font-medium text-muted-foreground">
                {filter === "all"
                  ? `${items.length} items`
                  : `${filteredItems.length} ${filter}s`}
              </span>
              {someSelected && (
                <span className="ml-auto text-xs text-primary font-medium">
                  {selectedCount} selected
                </span>
              )}
            </div>

            {/* Items */}
            {filteredItems.map((item, idx) => {
              const Icon = typeIcon[item.type];
              const count = item.subscriberCount ?? item.memberCount;
              const isSelected = selectedIds.has(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  data-ocid={`scan.item.${idx + 1}`}
                  onClick={() => handleToggle(item.id)}
                  className={cn(
                    "w-full text-left flex items-center gap-3 px-4 py-3 border-b border-border last:border-0 cursor-pointer transition-colors duration-150",
                    isSelected
                      ? "bg-primary/5 hover:bg-primary/10"
                      : "hover:bg-muted/40",
                  )}
                >
                  {/* Checkbox */}
                  <div
                    className={cn(
                      "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-smooth",
                      isSelected
                        ? "bg-primary border-primary"
                        : "border-border hover:border-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    {isSelected && (
                      <svg
                        className="w-2.5 h-2.5 text-primary-foreground"
                        fill="none"
                        viewBox="0 0 12 12"
                        aria-hidden="true"
                        role="img"
                      >
                        <title>Selected</title>
                        <path
                          d="M2 6l3 3 5-5"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>

                  {/* Type icon */}
                  <div
                    className={cn(
                      "w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0",
                      typeColor[item.type],
                    )}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Name + type */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {typeLabel[item.type]}
                    </p>
                  </div>

                  {/* Count */}
                  {count !== undefined && (
                    <p className="text-xs text-muted-foreground font-mono flex-shrink-0">
                      {count.toLocaleString()} members
                    </p>
                  )}
                </button>
              );
            })}

            {filteredItems.length === 0 && (
              <div
                className="py-10 text-center text-sm text-muted-foreground"
                data-ocid="scan.empty_state"
              >
                No items in this category.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleBack}
          data-ocid="scan.back_button"
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground/60 transition-smooth"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={selectedCount === 0}
          data-ocid="scan.next_button"
          className={cn(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-smooth",
            selectedCount > 0
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
          )}
        >
          Review & Select
          {selectedCount > 0 && (
            <span className="rounded-full bg-primary-foreground/20 text-xs px-1.5 py-0.5 font-mono">
              {selectedCount}
            </span>
          )}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
