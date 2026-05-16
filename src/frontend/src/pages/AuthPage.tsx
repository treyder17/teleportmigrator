import { useWizard } from "@/hooks/useWizard";
import { cn } from "@/lib/utils";
import type { AuthState } from "@/types";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Phone,
  QrCode,
  RefreshCw,
  Shield,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SiTelegram } from "react-icons/si";
import { toast } from "sonner";

type AccountSlot = "A" | "B";
type AuthMethod = "phone" | "qr";

// Mock user profiles per slot
const MOCK_PROFILES: Record<AccountSlot, { name: string; handle: string }> = {
  A: { name: "John Doe", handle: "@johndoe" },
  B: { name: "Jane Smith", handle: "@janesmith" },
};

/** Generates a deterministic-looking QR-style grid from a seed */
function QrMockCanvas({ seed }: { seed: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const size = 120;
    const cells = 20;
    const cell = size / cells;
    canvas.width = size;
    canvas.height = size;

    // Simple seeded pseudo-random from string hash
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    }
    const rand = () => {
      hash = (hash * 1664525 + 1013904223) >>> 0;
      return hash / 0xffffffff;
    };

    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, size, size);

    ctx.fillStyle = "#5bcefa";

    for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
        // Force corner finder patterns (top-left, top-right, bottom-left)
        const inTopLeft = row < 7 && col < 7;
        const inTopRight = row < 7 && col >= cells - 7;
        const inBottomLeft = row >= cells - 7 && col < 7;
        let filled = false;

        if (inTopLeft || inTopRight || inBottomLeft) {
          const r = inTopLeft ? row : inTopRight ? row : row - (cells - 7);
          const c = inTopLeft ? col : inTopRight ? col - (cells - 7) : col;
          filled =
            r === 0 ||
            r === 6 ||
            c === 0 ||
            c === 6 ||
            (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        } else {
          filled = rand() > 0.55;
        }

        if (filled) {
          ctx.fillRect(col * cell, row * cell, cell - 0.5, cell - 0.5);
        }
      }
    }
  }, [seed]);

  return (
    <canvas
      ref={canvasRef}
      width={120}
      height={120}
      className="rounded-sm"
      style={{ imageRendering: "pixelated" }}
    />
  );
}

interface AccountAuthFormProps {
  slot: AccountSlot;
  label: string;
  description: string;
  auth: AuthState | null;
  onVerified: (auth: AuthState) => void;
}

function AccountAuthForm({
  slot,
  label,
  description,
  auth,
  onVerified,
}: AccountAuthFormProps) {
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"input" | "verify">("input");
  const [loading, setLoading] = useState(false);
  const [qrSeed] = useState(() => `${slot}-${Date.now()}`);
  const [qrExpired, setQrExpired] = useState(false);
  const qrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isVerified = auth?.status === "verified";
  const profile = MOCK_PROFILES[slot];
  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  // QR auto-expire simulation
  useEffect(() => {
    if (method === "qr" && !isVerified) {
      setQrExpired(false);
      qrTimerRef.current = setTimeout(() => setQrExpired(true), 30000);
    }
    return () => {
      if (qrTimerRef.current) clearTimeout(qrTimerRef.current);
    };
  }, [method, isVerified]);

  const handleSendCode = async () => {
    if (!phone.trim()) {
      toast.error("Enter a phone number");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    setStep("verify");
    toast.success(`Code sent to ${phone}`);
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error("Enter the verification code");
      return;
    }
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
    onVerified({ phone, sessionHash: crypto.randomUUID(), status: "verified" });
    toast.success(`Account ${slot} authenticated as ${profile.name}`);
  };

  const handleQrLogin = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1500));
    setLoading(false);
    onVerified({
      phone: profile.handle,
      sessionHash: crypto.randomUUID(),
      status: "verified",
    });
    toast.success(`Account ${slot} authenticated via QR as ${profile.name}`);
  };

  return (
    <div
      data-ocid={`auth.account-${slot.toLowerCase()}.card`}
      className={cn(
        "rounded-xl border transition-smooth overflow-hidden",
        isVerified
          ? "border-primary/40 bg-card glow-primary"
          : "border-border bg-card",
      )}
    >
      {/* Slot color bar */}
      <div
        className={cn(
          "h-0.5 w-full",
          slot === "A" ? "bg-primary" : "bg-primary/60",
        )}
      />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                isVerified ? "bg-primary/15" : "bg-muted",
              )}
            >
              <SiTelegram
                className={cn(
                  "w-4 h-4",
                  isVerified ? "text-primary" : "text-muted-foreground",
                )}
              />
            </div>
            <div>
              <p className="font-display font-semibold text-sm text-foreground leading-tight">
                {label}
              </p>
              <p className="text-xs text-muted-foreground">{description}</p>
            </div>
          </div>
          {isVerified && (
            <div className="flex items-center gap-1 text-xs font-medium text-primary">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified</span>
            </div>
          )}
        </div>

        {/* Verified profile */}
        {isVerified ? (
          <div className="rounded-lg bg-primary/8 border border-primary/20 p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/20 text-primary font-display font-semibold text-sm">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {profile.name}
              </p>
              <p className="text-xs text-muted-foreground font-mono truncate">
                {auth?.phone}
              </p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
          </div>
        ) : (
          <div className="space-y-3">
            {/* Method toggle */}
            <div
              className="flex rounded-lg border border-border bg-muted/30 p-0.5 gap-0.5"
              role="tablist"
              aria-label={`Auth method for Account ${slot}`}
            >
              {(["phone", "qr"] as AuthMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={method === m}
                  data-ocid={`auth.account-${slot.toLowerCase()}.method_${m}`}
                  onClick={() => setMethod(m)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-medium transition-colors-fast",
                    method === m
                      ? "bg-primary/15 text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m === "phone" ? (
                    <Phone className="w-3 h-3" />
                  ) : (
                    <QrCode className="w-3 h-3" />
                  )}
                  {m === "phone" ? "Phone" : "QR Code"}
                </button>
              ))}
            </div>

            {/* QR panel */}
            {method === "qr" ? (
              <div className="rounded-lg bg-background border border-border p-4 flex flex-col items-center gap-3">
                <div className="relative">
                  <div
                    className={cn(
                      "p-2 rounded-lg border-2 transition-smooth",
                      qrExpired
                        ? "border-destructive/40 opacity-40"
                        : "border-primary/30 bg-muted/20",
                    )}
                  >
                    <QrMockCanvas seed={qrSeed} />
                  </div>
                  {qrExpired && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-2">
                        QR Expired
                      </p>
                      <button
                        type="button"
                        onClick={() => setQrExpired(false)}
                        className="flex items-center gap-1 text-xs text-primary hover:opacity-80 transition-colors-fast"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Refresh
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-[160px]">
                  Open Telegram → Settings → Devices → Scan QR
                </p>
                {!qrExpired && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleQrLogin}
                    data-ocid={`auth.account-${slot.toLowerCase()}.qr_confirm_button`}
                    className={cn(
                      "w-full rounded-lg bg-primary/15 border border-primary/30 text-primary text-xs font-medium py-1.5 transition-smooth",
                      "hover:bg-primary/25 disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  >
                    {loading ? "Authenticating…" : "Simulate QR Scan"}
                  </button>
                )}
              </div>
            ) : step === "input" ? (
              /* Phone input */
              <div className="space-y-2">
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <input
                    type="tel"
                    placeholder="+1 555 000 0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendCode()}
                    data-ocid={`auth.account-${slot.toLowerCase()}.phone_input`}
                    className="w-full rounded-lg border border-input bg-background pl-9 pr-3 py-2 text-sm font-mono placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-smooth"
                  />
                </div>
                <button
                  type="button"
                  disabled={loading || !phone.trim()}
                  onClick={handleSendCode}
                  data-ocid={`auth.account-${slot.toLowerCase()}.send_code_button`}
                  className={cn(
                    "w-full rounded-lg bg-primary/15 border border-primary/30 text-primary text-sm font-medium py-2 transition-smooth",
                    "hover:bg-primary/25 disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                      Sending…
                    </span>
                  ) : (
                    "Send Verification Code"
                  )}
                </button>
              </div>
            ) : (
              /* Verify code */
              <div className="space-y-2">
                <div className="rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-xs text-primary/80 flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Code sent to{" "}
                  <span className="font-mono font-medium">{phone}</span>
                  <button
                    type="button"
                    onClick={() => setStep("input")}
                    className="ml-auto text-muted-foreground hover:text-foreground transition-colors-fast text-xs underline"
                  >
                    Change
                  </button>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="Enter 6-digit code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                  data-ocid={`auth.account-${slot.toLowerCase()}.code_input`}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm font-mono tracking-widest text-center placeholder:text-muted-foreground placeholder:tracking-normal focus:outline-none focus:ring-1 focus:ring-ring transition-smooth"
                />
                <button
                  type="button"
                  disabled={loading || code.length < 5}
                  onClick={handleVerify}
                  data-ocid={`auth.account-${slot.toLowerCase()}.verify_button`}
                  className={cn(
                    "w-full rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2 transition-smooth",
                    "hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed",
                  )}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Verifying…
                    </span>
                  ) : (
                    "Verify & Connect"
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function AuthPage() {
  const { session, setAccountAAuth, setAccountBAuth, setCurrentStep } =
    useWizard();
  const navigate = useNavigate();

  const bothVerified =
    session.accountAAuth?.status === "verified" &&
    session.accountBAuth?.status === "verified";

  const connectedCount =
    (session.accountAAuth?.status === "verified" ? 1 : 0) +
    (session.accountBAuth?.status === "verified" ? 1 : 0);

  const handleNext = () => {
    setCurrentStep("scan");
    navigate({ to: "/scan" });
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">
      {/* Page header */}
      <div className="space-y-1">
        <h2 className="font-display font-semibold text-2xl text-foreground">
          Dual-Account Authentication
        </h2>
        <p className="text-sm text-muted-foreground">
          Connect both Telegram accounts to begin the migration. Account A is
          your source; Account B is the destination.
        </p>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-2.5 rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
        <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Sessions are ephemeral and never stored server-side. MTProto
          authentication runs client-side via your browser session.
        </p>
      </div>

      {/* Progress indicator */}
      <div className="grid grid-cols-2 gap-2">
        {(["A", "B"] as AccountSlot[]).map((slot) => {
          const authState =
            slot === "A" ? session.accountAAuth : session.accountBAuth;
          const verified = authState?.status === "verified";
          return (
            <div
              key={slot}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-smooth",
                verified
                  ? "border-primary/30 bg-primary/8 text-primary"
                  : "border-border bg-muted/20 text-muted-foreground",
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                  verified
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {slot}
              </div>
              {verified ? (
                <>
                  <CheckCircle2 className="w-3 h-3 shrink-0" />
                  <span className="truncate">{MOCK_PROFILES[slot].name}</span>
                </>
              ) : (
                <span className="truncate">Account {slot} — Not connected</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Account forms */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AccountAuthForm
          slot="A"
          label="Source Account A"
          description="Chats & channels to migrate from"
          auth={session.accountAAuth}
          onVerified={setAccountAAuth}
        />
        <AccountAuthForm
          slot="B"
          label="Target Account B"
          description="Destination account"
          auth={session.accountBAuth}
          onVerified={setAccountBAuth}
        />
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          {bothVerified ? (
            <span className="text-primary flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Both accounts connected — ready to scan
            </span>
          ) : (
            `${connectedCount} of 2 accounts connected`
          )}
        </p>
        <button
          type="button"
          disabled={!bothVerified}
          onClick={handleNext}
          data-ocid="auth.next_button"
          className={cn(
            "flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-smooth",
            bothVerified
              ? "bg-primary text-primary-foreground hover:opacity-90 glow-primary"
              : "bg-muted text-muted-foreground cursor-not-allowed opacity-60",
          )}
        >
          Continue to Scanner
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
