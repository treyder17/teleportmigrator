import { createActor } from "@/backend";
import { useWizard } from "@/hooks/useWizard";
import { cn } from "@/lib/utils";
import type { AccountItem, AccountItemType } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Folder,
  Hash,
  Info,
  Megaphone,
  Scan,
  Users,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

// ─── Type metadata ────────────────────────────────────────────────────────────

const typeIcon: Record<AccountItemType, typeof Users> = {
  channel: Megaphone,
  group: Users,
  supergroup: Users,
  chat: Hash,
  bot: Bot,
  folder: Folder,
};

type BadgeVariant = "cyan" | "amber" | "purple" | "blue";

const typeBadge: Record<
  AccountItemType,
  { label: string; variant: BadgeVariant }
> = {
  channel: { label: "Auto-Join", variant: "cyan" },
  supergroup: { label: "Auto-Join", variant: "cyan" },
  group: { label: "Replicate + History", variant: "amber" },
  chat: { label: "Replicate + History", variant: "amber" },
  bot: { label: "Start Bot", variant: "purple" },
  folder: { label: "Recreate Structure", variant: "blue" },
};

const badgeClass: Record<BadgeVariant, string> = {
  cyan: "bg-cyan-500/15 text-cyan-400 ring-1 ring-cyan-500/30",
  amber: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  purple: "bg-purple-500/15 text-purple-400 ring-1 ring-purple-500/30",
  blue: "bg-blue-500/15 text-blue-400 ring-1 ring-blue-500/30",
};

const GROUP_ORDER: AccountItemType[] = [
  "channel",
  "supergroup",
  "group",
  "chat",
  "bot",
  "folder",
];

const GROUP_LABELS: Record<AccountItemType, string> = {
  channel: "Channels",
  supergroup: "Supergroups",
  group: "Groups",
  chat: "Chats",
  bot: "Bots",
  folder: "Folders",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StrategyBadge({ type }: { type: AccountItemType }) {
  const { label, variant } = typeBadge[type];
  return (
    <span
      className={cn(
        "text-[10px] font-semibold px-2 py-0.5 rounded-full leading-none",
        badgeClass[variant],
      )}
    >
      {label}
    </span>
  );
}

function SummaryCard({
  items,
  selectedIds,
}: { items: AccountItem[]; selectedIds: string[] }) {
  const selectedSet = new Set(selectedIds);
  const countByType = GROUP_ORDER.reduce<Record<string, number>>((acc, t) => {
    const n = items.filter((i) => i.type === t && selectedSet.has(i.id)).length;
    if (n > 0) acc[t] = n;
    return acc;
  }, {});

  return (
    <div
      className="rounded-xl border border-border bg-card px-5 py-4 space-y-3"
      data-ocid="preview.summary-panel"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-foreground">
          Transfer Plan Summary
        </p>
        <span className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            {selectedIds.length}
          </span>{" "}
          item{selectedIds.length !== 1 ? "s" : ""} selected
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(countByType).map(([type, count]) => {
          const t = type as AccountItemType;
          const Icon = typeIcon[t];
          const { label, variant } = typeBadge[t];
          return (
            <div
              key={t}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium",
                badgeClass[variant],
              )}
            >
              <Icon className="w-3 h-3" />
              <span>
                {count} {GROUP_LABELS[t]}
              </span>
              <span className="opacity-60">·</span>
              <span>{label}</span>
            </div>
          );
        })}
        {Object.keys(countByType).length === 0 && (
          <p className="text-xs text-muted-foreground">
            No items selected yet.
          </p>
        )}
      </div>
    </div>
  );
}

function InfoCallout() {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <div
      className="flex gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3"
      data-ocid="preview.info-callout"
    >
      <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
      <p className="text-xs text-blue-300/90 leading-relaxed">
        Messages transferred to{" "}
        <span className="font-semibold text-blue-300">Chats</span> and{" "}
        <span className="font-semibold text-blue-300">Groups</span> will include
        a footer:{" "}
        <span className="font-mono text-blue-200 bg-blue-500/10 px-1.5 py-0.5 rounded">
          Transferred on {today}
        </span>
      </p>
    </div>
  );
}

function TypeGroupSection({
  type,
  items,
  selectedIds,
  groupIndex,
}: {
  type: AccountItemType;
  items: AccountItem[];
  selectedIds: string[];
  groupIndex: number;
}) {
  const Icon = typeIcon[type];
  const selectedSet = new Set(selectedIds);
  const selectedCount = items.filter((i) => selectedSet.has(i.id)).length;

  return (
    <div
      className="rounded-xl border border-border bg-card overflow-hidden"
      data-ocid={`preview.group.${groupIndex}`}
    >
      {/* Group header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
            {GROUP_LABELS[type]}
          </span>
          <span className="text-xs text-muted-foreground">
            ({items.length})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StrategyBadge type={type} />
          {selectedCount > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {selectedCount} selected
            </span>
          )}
        </div>
      </div>

      {/* Items */}
      {items.map((item, i) => {
        const isSelected = selectedSet.has(item.id);
        const count = item.memberCount ?? item.subscriberCount;
        return (
          <div
            key={item.id}
            data-ocid={`preview.item.${groupIndex}.${i + 1}`}
            className={cn(
              "flex items-center gap-3 px-4 py-3 border-b border-border last:border-0",
              "transition-colors-fast",
              isSelected ? "bg-primary/5" : "bg-transparent",
            )}
          >
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 border",
                isSelected
                  ? "bg-primary/12 border-primary/25 text-primary"
                  : "bg-muted/40 border-border text-muted-foreground",
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-sm font-medium truncate",
                  isSelected ? "text-foreground" : "text-foreground/70",
                )}
              >
                {item.name}
              </p>
              {count != null && (
                <p className="text-xs text-muted-foreground">
                  {type === "channel" || type === "supergroup"
                    ? `${count.toLocaleString()} subscribers`
                    : `${count.toLocaleString()} members`}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function PreviewPage() {
  const { session, setCurrentStep, setTransferJobId } = useWizard();
  const { actor } = useActor(createActor);
  const navigate = useNavigate();
  const [isStarting, setIsStarting] = useState(false);

  const { scannedItems, selectedItems } = session;

  // Build groups from SELECTED items only
  const selectedSet = new Set(selectedItems);
  const selectedScanned = scannedItems.filter((i) => selectedSet.has(i.id));

  const groupedItems = GROUP_ORDER.reduce<
    Record<AccountItemType, AccountItem[]>
  >(
    (acc, t) => {
      const items = selectedScanned.filter((i) => i.type === t);
      if (items.length > 0) acc[t] = items;
      return acc;
    },
    {} as Record<AccountItemType, AccountItem[]>,
  );

  const hasGroups = Object.keys(groupedItems).length > 0;
  const noneSelected = selectedItems.length === 0;

  const handleBack = () => {
    setCurrentStep("scan");
    navigate({ to: "/scan" });
  };

  const handleStartMigration = async () => {
    if (noneSelected || isStarting) return;
    setIsStarting(true);
    try {
      let jobId: string | undefined;
      if (actor) {
        const result = await actor.createTransferJob(session.id);
        // Result is Option<JobId> — may be [] (null) or [id]
        if (Array.isArray(result) && result.length > 0) {
          jobId = result[0] as string;
        } else if (typeof result === "string") {
          jobId = result;
        }
      }
      // Fallback: generate a local job ID for prototype flows
      const resolvedJobId = jobId ?? `job-${crypto.randomUUID()}`;
      setTransferJobId(resolvedJobId);
      setCurrentStep("execute");
      navigate({ to: "/execute" });
    } catch (err) {
      console.error("createTransferJob failed:", err);
      toast.error("Failed to start migration. Please try again.");
    } finally {
      setIsStarting(false);
    }
  };

  // ── Empty state (no scanned items at all) ──────────────────────────────────
  if (scannedItems.length === 0) {
    return (
      <div className="max-w-3xl mx-auto animate-fade-up">
        <div
          data-ocid="preview.empty_state"
          className="rounded-xl border border-border bg-card px-5 py-16 flex flex-col items-center gap-4 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-muted/40 border border-border flex items-center justify-center">
            <Scan className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              No items scanned yet
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Run a full account scan first to see your chats, channels, groups,
              bots, and folders here.
            </p>
          </div>
          <button
            type="button"
            onClick={handleBack}
            data-ocid="preview.go-to-scan-button"
            className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-smooth"
          >
            <ArrowLeft className="w-4 h-4" /> Go to Scanner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-up">
      {/* Page header */}
      <div className="space-y-1">
        <h2 className="font-display font-semibold text-2xl text-foreground">
          Transfer Preview
        </h2>
        <p className="text-sm text-muted-foreground">
          Review the transfer plan for each selected item before starting the
          migration.
        </p>
      </div>

      {/* Summary panel */}
      <SummaryCard items={scannedItems} selectedIds={selectedItems} />

      {/* Info callout */}
      <InfoCallout />

      {/* No items selected warning */}
      {!hasGroups && (
        <div
          data-ocid="preview.no-selection-warning"
          className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3"
        >
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300/90">
            No items selected. Go back to the scanner and select items to
            migrate.
          </p>
        </div>
      )}

      {/* Grouped item sections */}
      {hasGroups && (
        <div className="space-y-4" data-ocid="preview.item-list">
          {(
            Object.entries(groupedItems) as [AccountItemType, AccountItem[]][]
          ).map(([type, items], groupIndex) => (
            <TypeGroupSection
              key={type}
              type={type}
              items={items}
              selectedIds={selectedItems}
              groupIndex={groupIndex + 1}
            />
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handleBack}
          data-ocid="preview.back-button"
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground transition-smooth"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button
          type="button"
          onClick={handleStartMigration}
          disabled={noneSelected || isStarting}
          data-ocid="preview.start-migration-button"
          className={cn(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-smooth",
            !noneSelected && !isStarting
              ? "bg-primary text-primary-foreground hover:opacity-90 glow-primary"
              : "bg-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          {isStarting ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              Starting…
            </>
          ) : (
            <>
              Start Migration <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
