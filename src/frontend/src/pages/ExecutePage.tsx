import { useWizard } from "@/hooks/useWizard";
import { cn } from "@/lib/utils";
import type {
  AccountItem,
  AccountItemType,
  TransferLogEntry,
  TransferStatus,
} from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Folder,
  Hash,
  Loader2,
  Megaphone,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// ─── constants ──────────────────────────────────────────────────────────────

const typeIcon: Record<AccountItemType, typeof Users> = {
  channel: Megaphone,
  group: Users,
  supergroup: Users,
  chat: Hash,
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

const statusColor: Record<TransferStatus, string> = {
  pending: "text-muted-foreground",
  in_progress: "text-primary",
  completed: "text-emerald-400",
  failed: "text-destructive",
  skipped: "text-muted-foreground",
};

// ─── types ───────────────────────────────────────────────────────────────────

interface ItemProgress {
  id: string;
  name: string;
  type: AccountItemType;
  status: TransferStatus;
  progress: number; // 0-100
  startedAt?: number;
  finishedAt?: number;
}

interface LogRow {
  id: string;
  time: string;
  itemName: string;
  itemType: AccountItemType;
  status: TransferStatus;
  durationMs?: number;
}

// ─── sub-components ─────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: TransferStatus }) {
  const map: Record<
    TransferStatus,
    { label: string; cls: string; icon: typeof CheckCircle2 | null }
  > = {
    pending: {
      label: "Pending",
      cls: "bg-muted text-muted-foreground",
      icon: null,
    },
    in_progress: {
      label: "Transferring",
      cls: "bg-primary/15 text-primary border border-primary/30",
      icon: Loader2,
    },
    completed: {
      label: "Complete",
      cls: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
      icon: CheckCircle2,
    },
    failed: {
      label: "Failed",
      cls: "bg-destructive/15 text-destructive border border-destructive/30",
      icon: XCircle,
    },
    skipped: {
      label: "Skipped",
      cls: "bg-muted text-muted-foreground",
      icon: null,
    },
  };
  const { label, cls, icon: Icon } = map[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        cls,
      )}
    >
      {Icon && (
        <Icon
          className={cn(
            "w-2.5 h-2.5",
            status === "in_progress" && "animate-spin",
          )}
        />
      )}
      {label}
    </span>
  );
}

function ProgressBar({ value, active }: { value: number; active: boolean }) {
  return (
    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-300",
          active
            ? "bg-primary"
            : value === 100
              ? "bg-emerald-500"
              : "bg-destructive/70",
        )}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ─── main component ──────────────────────────────────────────────────────────

export function ExecutePage() {
  const { session, setTransferJobId, addTransferLog, setCurrentStep } =
    useWizard();
  const navigate = useNavigate();

  const selectedItems: AccountItem[] = session.scannedItems.filter((i) =>
    session.selectedItems.includes(i.id),
  );

  // Simulation state
  const [phase, setPhase] = useState<"idle" | "running" | "cancelled" | "done">(
    "idle",
  );
  const [itemStates, setItemStates] = useState<ItemProgress[]>(() =>
    selectedItems.map((it) => ({
      id: it.id,
      name: it.name,
      type: it.type,
      status: "pending",
      progress: 0,
    })),
  );
  const [logRows, setLogRows] = useState<LogRow[]>([]);
  const [overallProgress, setOverallProgress] = useState(0);

  const cancelledRef = useRef(false);
  const logScrollRef = useRef<HTMLDivElement>(null);
  const logBottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log — logRows.length triggers without adding logRows to deps
  const logRowsLen = logRows.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on length change only
  useEffect(() => {
    logBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logRowsLen]);

  const appendLog = useCallback((row: LogRow) => {
    setLogRows((prev) => [...prev, row]);
  }, []);

  // ─── simulation engine ──────────────────────────────────────────────────
  const runTransfer = useCallback(async () => {
    if (selectedItems.length === 0) return;
    cancelledRef.current = false;
    setPhase("running");

    const jobId = crypto.randomUUID();
    setTransferJobId(jobId);

    const total = selectedItems.length;
    let completedCount = 0;

    // Process items 2 at a time for realism
    const CONCURRENCY = 2;

    const processItem = async (
      item: AccountItem,
      idx: number,
    ): Promise<void> => {
      if (cancelledRef.current) return;

      const startTs = Date.now();
      const startTime = new Date().toISOString();

      // Mark as in_progress
      setItemStates((prev) =>
        prev.map((s) =>
          s.id === item.id
            ? { ...s, status: "in_progress", startedAt: startTs }
            : s,
        ),
      );

      appendLog({
        id: `${item.id}-start`,
        time: new Date(startTime).toLocaleTimeString(),
        itemName: item.name,
        itemType: item.type,
        status: "in_progress",
      });

      // Simulate progress ticks (0→100 over 1–3 seconds)
      const durationMs = 1000 + Math.random() * 2000;
      const tickMs = 80;
      const ticks = Math.ceil(durationMs / tickMs);

      for (let t = 1; t <= ticks; t++) {
        if (cancelledRef.current) return;
        await new Promise((r) => setTimeout(r, tickMs));
        const pct = Math.min(100, Math.round((t / ticks) * 100));
        setItemStates((prev) =>
          prev.map((s) => (s.id === item.id ? { ...s, progress: pct } : s)),
        );
      }

      if (cancelledRef.current) return;

      const success = Math.random() > 0.1; // 10% failure rate
      const endTs = Date.now();
      const finalStatus: TransferStatus = success ? "completed" : "failed";

      setItemStates((prev) =>
        prev.map((s) =>
          s.id === item.id
            ? { ...s, status: finalStatus, progress: 100, finishedAt: endTs }
            : s,
        ),
      );

      appendLog({
        id: `${item.id}-end`,
        time: new Date().toLocaleTimeString(),
        itemName: item.name,
        itemType: item.type,
        status: finalStatus,
        durationMs: endTs - startTs,
      });

      // Sync to wizard context for persistence
      const log: TransferLogEntry = {
        id: crypto.randomUUID(),
        jobId,
        itemId: item.id,
        itemName: item.name,
        itemType: item.type,
        status: finalStatus,
        message: success
          ? `"${item.name}" transferred successfully`
          : `Failed to transfer "${item.name}" — retry later`,
        timestamp: new Date().toISOString(),
      };
      addTransferLog(log);

      completedCount++;
      setOverallProgress(Math.round((completedCount / total) * 100));

      void idx; // suppress unused warning
    };

    // Chunk items into batches of CONCURRENCY
    for (let i = 0; i < selectedItems.length; i += CONCURRENCY) {
      if (cancelledRef.current) break;
      const batch = selectedItems.slice(i, i + CONCURRENCY);
      await Promise.all(batch.map((item, j) => processItem(item, i + j)));
    }

    if (!cancelledRef.current) {
      setPhase("done");
      setOverallProgress(100);
    }
  }, [selectedItems, setTransferJobId, addTransferLog, appendLog]);

  const handleStart = () => {
    void runTransfer();
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    setPhase("cancelled");
    // Mark any in-progress items as failed
    setItemStates((prev) =>
      prev.map((s) =>
        s.status === "in_progress" || s.status === "pending"
          ? { ...s, status: "failed", progress: s.progress }
          : s,
      ),
    );
  };

  const handleNext = () => {
    setCurrentStep("done");
    navigate({ to: "/done" });
  };

  // ─── derived stats ─────────────────────────────────────────────────────
  const completedItems = itemStates.filter(
    (s) => s.status === "completed",
  ).length;
  const failedItems = itemStates.filter((s) => s.status === "failed").length;
  const inProgressItems = itemStates.filter(
    (s) => s.status === "in_progress",
  ).length;
  const remainingItems = itemStates.filter(
    (s) => s.status === "pending",
  ).length;
  const isRunning = phase === "running";
  const isDone = phase === "done";
  const isCancelled = phase === "cancelled";

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="font-display font-semibold text-2xl text-foreground">
            Live Migration
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRunning
              ? `Processing ${selectedItems.length} items — please do not close this window.`
              : isDone
                ? `Migration finished. ${completedItems} transferred, ${failedItems} failed.`
                : isCancelled
                  ? "Transfer was cancelled."
                  : `Ready to transfer ${selectedItems.length} selected item${selectedItems.length !== 1 ? "s" : ""}.`}
          </p>
        </div>

        {isRunning && (
          <button
            type="button"
            onClick={handleCancel}
            data-ocid="execute.cancel-button"
            className="flex-shrink-0 flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-smooth"
          >
            <XCircle className="w-3.5 h-3.5" /> Cancel
          </button>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-3" data-ocid="execute.stats-row">
        {[
          {
            label: "Completed",
            value: completedItems,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10 border-emerald-500/20",
          },
          {
            label: "Failed",
            value: failedItems,
            color: "text-destructive",
            bg: "bg-destructive/10 border-destructive/20",
          },
          {
            label: "In Progress",
            value: inProgressItems,
            color: "text-primary",
            bg: "bg-primary/10 border-primary/20",
          },
          {
            label: "Remaining",
            value: remainingItems,
            color: "text-muted-foreground",
            bg: "bg-muted border-border",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className={cn("rounded-xl border px-4 py-3", stat.bg)}
          >
            <p className={cn("text-2xl font-display font-bold", stat.color)}>
              {stat.value}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <div className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">
            Overall Progress
          </p>
          <p className="text-sm font-mono text-primary">
            {completedItems + failedItems} / {selectedItems.length}{" "}
            &nbsp;·&nbsp; {overallProgress}%
          </p>
        </div>
        <div
          className="h-2.5 rounded-full bg-muted overflow-hidden"
          data-ocid="execute.overall-progress-bar"
        >
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isDone
                ? "bg-emerald-500"
                : isCancelled
                  ? "bg-destructive/70"
                  : "bg-primary",
            )}
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {phase === "idle" && (
          <button
            type="button"
            onClick={handleStart}
            data-ocid="execute.start-button"
            className="w-full rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2.5 hover:opacity-90 transition-smooth glow-primary"
          >
            Begin Transfer
          </button>
        )}
        {isRunning && (
          <div className="flex items-center justify-center gap-2 py-1 text-sm text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            Transferring — do not close this window
          </div>
        )}
      </div>

      {/* Migration Complete banner */}
      {isDone && (
        <div
          data-ocid="execute.success-state"
          className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 flex items-center gap-3"
        >
          <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-emerald-400">
              Migration Complete!
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedItems} item{completedItems !== 1 ? "s" : ""} transferred
              successfully
              {failedItems > 0 ? `, ${failedItems} failed` : ""}.
            </p>
          </div>
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
        </div>
      )}

      {/* Cancelled banner */}
      {isCancelled && (
        <div
          data-ocid="execute.cancelled-state"
          className="rounded-xl border border-destructive/30 bg-destructive/10 px-5 py-4 flex items-center gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-destructive">
              Transfer Cancelled
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {completedItems} item{completedItems !== 1 ? "s" : ""} completed
              before cancellation.
            </p>
          </div>
        </div>
      )}

      {/* Per-item progress list */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Items
          </p>
          <p className="text-xs text-muted-foreground">
            {selectedItems.length} total
          </p>
        </div>
        <div
          className="divide-y divide-border max-h-72 overflow-y-auto"
          data-ocid="execute.items-list"
        >
          {itemStates.map((item, i) => {
            const Icon = typeIcon[item.type];
            return (
              <div
                key={item.id}
                data-ocid={`execute.item.${i + 1}`}
                className="px-4 py-3 flex items-center gap-3 min-w-0"
              >
                <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate flex-1">
                      {item.name}
                    </p>
                    <StatusBadge status={item.status} />
                  </div>
                  <ProgressBar
                    value={item.progress}
                    active={item.status === "in_progress"}
                  />
                </div>
                <p className="text-[10px] font-mono text-muted-foreground flex-shrink-0 w-7 text-right">
                  {item.progress}%
                </p>
              </div>
            );
          })}
          {selectedItems.length === 0 && (
            <div
              className="px-4 py-8 text-center text-sm text-muted-foreground"
              data-ocid="execute.items-empty_state"
            >
              No items selected for transfer.
            </div>
          )}
        </div>
      </div>

      {/* Transfer log table */}
      {logRows.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Transfer Log
            </p>
            <span className="ml-auto text-xs text-muted-foreground">
              {logRows.length} entries
            </span>
          </div>

          {/* Table header */}
          <div className="grid grid-cols-[80px_1fr_90px_100px_70px] gap-x-3 px-4 py-2 border-b border-border bg-muted/40">
            {["Time", "Item Name", "Type", "Status", "Duration"].map((h) => (
              <p
                key={h}
                className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate"
              >
                {h}
              </p>
            ))}
          </div>

          {/* Table rows */}
          <div
            ref={logScrollRef}
            className="max-h-56 overflow-y-auto"
            data-ocid="execute.log-table"
          >
            {logRows.map((row, i) => {
              const Icon = typeIcon[row.itemType];
              return (
                <div
                  key={row.id}
                  data-ocid={`execute.log.${i + 1}`}
                  className="grid grid-cols-[80px_1fr_90px_100px_70px] gap-x-3 px-4 py-2.5 border-b border-border last:border-0 items-center animate-slide-in"
                >
                  <p className="text-[10px] font-mono text-muted-foreground truncate">
                    {row.time}
                  </p>
                  <p
                    className={cn(
                      "text-xs min-w-0 truncate font-medium",
                      statusColor[row.status],
                    )}
                  >
                    {row.itemName}
                  </p>
                  <div className="flex items-center gap-1 min-w-0">
                    <Icon className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <p className="text-[10px] text-muted-foreground truncate">
                      {typeLabel[row.itemType]}
                    </p>
                  </div>
                  <StatusBadge status={row.status} />
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {row.durationMs != null
                      ? `${(row.durationMs / 1000).toFixed(1)}s`
                      : "—"}
                  </p>
                </div>
              );
            })}
            <div ref={logBottomRef} />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-end pt-2">
        <button
          type="button"
          onClick={handleNext}
          disabled={!isDone && !isCancelled}
          data-ocid="execute.next-button"
          className={cn(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-smooth",
            isDone || isCancelled
              ? "bg-primary text-primary-foreground hover:opacity-90 glow-primary"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-50",
          )}
        >
          View Summary <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
