import { createActor } from "@/backend";
import { useWizard } from "@/hooks/useWizard";
import { cn } from "@/lib/utils";
import type { AuthState } from "@/types";
import { useActor } from "@caffeineai/core-infrastructure";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Phone,
  QrCode,
  Shield,
} from "lucide-react";
import { useState } from "react";
import { SiTelegram } from "react-icons/si";
import { toast } from "sonner";

type AccountSlot = "A" | "B";
type AuthMethod = "phone" | "qr";

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
  const { session } = useWizard();
  const { actor } = useActor(createActor);
  const [method, setMethod] = useState<AuthMethod>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"input" | "verify">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = session.id;
  const isVerified = auth?.status === "verified";
  const displayName = auth?.username ?? auth?.phone ?? "";
  const displayInitials =
    auth?.initials ??
    (displayName ? displayName.slice(0, 2).toUpperCase() : slot);

  const handleSendCode = async () => {
    if (!phone.trim()) {
      toast.error("Enter a phone number");
      return;
    }
    if (!actor) {
      toast.error("Backend not ready. Please try again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await (
        actor as {
          sendCode: (
            sessionId: string,
            phone: string,
            account: string,
          ) => Promise<
            { __kind__: "ok"; ok: null } | { __kind__: "err"; err: string }
          >;
        }
      ).sendCode(sessionId, phone, slot);
      if (res.__kind__ === "err") {
        setError(res.err);
        toast.error(res.err);
        return;
      }
      setStep("verify");
      toast.success(`Code sent to ${phone}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to send code";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code.trim()) {
      toast.error("Enter the verification code");
      return;
    }
    if (!actor) {
      toast.error("Backend not ready. Please try again.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await (
        actor as {
          verifyCode: (
            sessionId: string,
            phone: string,
            code: string,
            account: string,
          ) => Promise<
            | { __kind__: "ok"; ok: { username: string; initials: string } }
            | { __kind__: "err"; err: string }
          >;
        }
      ).verifyCode(sessionId, phone, code, slot);
      if (res.__kind__ === "err") {
        setError(res.err);
        toast.error(res.err);
        return;
      }
      const { username, initials } = res.ok;
      onVerified({
        phone,
        sessionHash: crypto.randomUUID(),
        status: "verified",
        username,
        initials,
      });
      toast.success(`Account ${slot} authenticated as ${username}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Verification failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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
              {displayInitials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground truncate">
                {displayName || auth?.phone}
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

            {/* QR panel — disabled */}
            {method === "qr" ? (
              <div className="rounded-lg bg-muted/20 border border-border p-4 flex flex-col items-center gap-3 text-center">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    QR Code Not Supported
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
                    QR Code authentication is not currently supported. Please
                    use Phone Number login instead.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMethod("phone")}
                  data-ocid={`auth.account-${slot.toLowerCase()}.qr_switch_button`}
                  className="text-xs text-primary hover:opacity-80 transition-colors-fast underline"
                >
                  Switch to Phone Login
                </button>
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
                {error && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {error}
                  </p>
                )}
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
                {error && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    {error}
                  </p>
                )}
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
                  <span className="truncate">
                    {slot === "A"
                      ? (session.accountAAuth?.username ??
                        session.accountAAuth?.phone)
                      : (session.accountBAuth?.username ??
                        session.accountBAuth?.phone)}
                  </span>
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
