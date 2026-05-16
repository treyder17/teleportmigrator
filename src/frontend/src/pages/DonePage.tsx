import { useWizard } from "@/hooks/useWizard";
import { cn } from "@/lib/utils";
import type { AccountItemType, TransferLogEntry } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  Bot,
  CheckCircle,
  CheckCircle2,
  Clock,
  Download,
  Folder,
  Hash,
  Megaphone,
  RotateCcw,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

const typeIcon: Record<AccountItemType, typeof Users> = {
  channel: Megaphone,
  group: Users,
  supergroup: Users,
  chat: Hash,
  bot: Bot,
  folder: Folder,
};

const typeLabel: Record<AccountItemType, string> = {
  channel: "Channels Joined",
  group: "Groups Replicated",
  supergroup: "Supergroups Replicated",
  chat: "Chats Replicated",
  bot: "Bots Started",
  folder: "Folders Created",
};

function getInitials(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-2) || "?";
}

function formatDuration(startIso: string, endIso: string): string {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  if (ms < 0) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function statusBadge(status: TransferLogEntry["status"]) {
  if (status === "completed")
    return <span className="text-xs font-medium text-emerald-400">Done</span>;
  if (status === "failed")
    return <span className="text-xs font-medium text-destructive">Failed</span>;
  if (status === "skipped")
    return (
      <span className="text-xs font-medium text-muted-foreground">Skipped</span>
    );
  return <span className="text-xs text-muted-foreground">{status}</span>;
}

export function DonePage() {
  const { session, resetSession } = useWizard();
  const navigate = useNavigate();
  const [completedAt] = useState(() => new Date().toISOString());
  const [checkVisible, setCheckVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCheckVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const logs = session.transferLogs;
  const completed = logs.filter((l) => l.status === "completed");
  const failed = logs.filter((l) => l.status === "failed");
  const total = session.selectedItems.length;
  const successRate =
    total > 0 ? Math.round((completed.length / total) * 100) : 0;

  const startTimes = logs.map((l) => l.timestamp).filter(Boolean);
  const firstStart = startTimes.length > 0 ? startTimes[0] : session.createdAt;
  const totalTime = formatDuration(firstStart, completedAt);

  const byType = completed.reduce<Partial<Record<AccountItemType, number>>>(
    (acc, l) => {
      acc[l.itemType] = (acc[l.itemType] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const typeBreakdown = (
    Object.entries(byType) as [AccountItemType, number][]
  ).filter(([, count]) => count > 0);

  const accountAName = session.accountAAuth?.phone ?? "Account A";
  const accountBName = session.accountBAuth?.phone ?? "Account B";

  const handleRestart = () => {
    resetSession();
    navigate({ to: "/" });
  };

  const handleDownload = () => {
    const today = new Date(completedAt).toLocaleDateString("en-GB");
    const lines: string[] = [
      "================================================",
      "         TELEGRAM MIGRATION REPORT",
      "================================================",
      `Session ID   : ${session.id}`,
      `Completed At : ${new Date(completedAt).toLocaleString()}`,
      `Source Acct  : ${accountAName}`,
      `Target Acct  : ${accountBName}`,
      "",
      "── STATS ──────────────────────────────────────",
      `Total Selected : ${total}`,
      `Transferred    : ${completed.length}`,
      `Failed         : ${failed.length}`,
      `Success Rate   : ${successRate}%`,
      `Total Time     : ${totalTime}`,
      "",
      "── BREAKDOWN BY TYPE ───────────────────────────",
      ...typeBreakdown.map(
        ([type, count]) => `  ${typeLabel[type].padEnd(24)}: ${count}`,
      ),
      "",
      "── TRANSFER LOG ────────────────────────────────",
      ...logs.map(
        (l) =>
          `[${l.status.toUpperCase().padEnd(10)}] ${l.itemType.padEnd(10)} ${l.itemName} — ${l.message}`,
      ),
      "",
      "── NOTE ────────────────────────────────────────",
      `Transferred messages include footer: "Transferred on ${today}"`,
      "================================================",
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `migration-report-${session.id.slice(0, 8)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fade-up">
      {/* Hero */}
      <div className="rounded-2xl border border-primary/30 bg-card glow-primary px-6 py-8 text-center space-y-3">
        <div
          className={cn(
            "w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/40 flex items-center justify-center mx-auto transition-all duration-700",
            checkVisible ? "scale-100 opacity-100" : "scale-50 opacity-0",
          )}
        >
          <CheckCircle
            className="w-10 h-10 text-primary drop-shadow-[0_0_8px_oklch(0.75_0.15_200)]"
            strokeWidth={1.5}
          />
        </div>
        <h2 className="font-display font-bold text-2xl text-foreground tracking-tight">
          Migration Complete
        </h2>
        <p className="text-sm text-muted-foreground">
          Completed on{" "}
          <span className="text-foreground font-medium">
            {new Date(completedAt).toLocaleString()}
          </span>
        </p>
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-4xl font-display font-bold text-primary">
            {successRate}%
          </span>
          <span className="text-sm text-muted-foreground">success rate</span>
        </div>
      </div>

      {/* Stats Grid (4 cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Total Transferred",
            value: total,
            cls: "text-foreground",
            Icon: null,
          },
          {
            label: "Successful",
            value: completed.length,
            cls: "text-emerald-400",
            Icon: CheckCircle2,
          },
          {
            label: "Failed",
            value: failed.length,
            cls:
              failed.length > 0 ? "text-destructive" : "text-muted-foreground",
            Icon: XCircle,
          },
          {
            label: "Total Time",
            value: totalTime,
            cls: "text-primary",
            Icon: Clock,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-border bg-card px-3 py-4 text-center flex flex-col items-center gap-1.5"
          >
            {s.Icon && (
              <s.Icon className={cn("w-4 h-4", s.cls)} strokeWidth={1.5} />
            )}
            <p
              className={cn(
                "text-xl font-display font-bold leading-tight",
                s.cls,
              )}
            >
              {s.value}
            </p>
            <p className="text-xs text-muted-foreground leading-tight">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Account Summary */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Account Summary
          </p>
        </div>
        <div className="grid grid-cols-2 divide-x divide-border">
          {[
            { label: "Source Account (A)", name: accountAName },
            { label: "Target Account (B)", name: accountBName },
          ].map((acc) => (
            <div
              key={acc.label}
              className="px-4 py-4 flex flex-col items-center gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
                <span className="text-sm font-display font-bold text-primary">
                  {getInitials(acc.name)}
                </span>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{acc.label}</p>
                <p className="text-sm font-medium text-foreground truncate max-w-[130px]">
                  {acc.name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown by Type */}
      {typeBreakdown.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Breakdown by Type
            </p>
          </div>
          <div className="divide-y divide-border">
            {typeBreakdown.map(([type, count]) => {
              const Icon = typeIcon[type];
              return (
                <div
                  key={type}
                  className="flex items-center justify-between px-4 py-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-primary" />
                    <span className="text-sm text-foreground">
                      {typeLabel[type]}
                    </span>
                  </div>
                  <span className="text-sm font-display font-semibold text-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transfer Log (last 5) */}
      {logs.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Recent Transfer Log
            </p>
            <span className="text-xs text-muted-foreground">
              {logs.length > 5
                ? `Last 5 of ${logs.length}`
                : `${logs.length} entries`}
            </span>
          </div>
          <div data-ocid="done.log-list">
            {logs.slice(-5).map((log, i) => {
              const Icon = typeIcon[log.itemType];
              return (
                <div
                  key={log.id}
                  data-ocid={`done.log.item.${i + 1}`}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0"
                >
                  {log.status === "completed" ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  ) : log.status === "failed" ? (
                    <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-muted-foreground flex-shrink-0" />
                  )}
                  <Icon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-foreground truncate flex-1 min-w-0">
                    {log.itemName}
                  </p>
                  {statusBadge(log.status)}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer note */}
      <p className="text-xs text-center text-muted-foreground">
        Transferred messages include footer:{" "}
        <span className="text-foreground font-medium">
          &ldquo;Transferred on{" "}
          {new Date(completedAt).toLocaleDateString("en-GB")}&rdquo;
        </span>
      </p>

      {/* Actions */}
      <div className="flex items-center justify-between gap-3 pb-2">
        <button
          type="button"
          onClick={handleRestart}
          data-ocid="done.restart-button"
          className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground border border-border hover:border-muted-foreground transition-smooth"
        >
          <RotateCcw className="w-4 h-4" /> Start New Migration
        </button>
        <button
          type="button"
          onClick={handleDownload}
          data-ocid="done.download-button"
          className="flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-smooth glow-primary"
        >
          <Download className="w-4 h-4" /> Download Report
        </button>
      </div>
    </div>
  );
}
