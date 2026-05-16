import { WizardStepIndicator } from "@/components/WizardStepIndicator";
import { useWizard } from "@/hooks/useWizard";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS } from "@/types";
import { Link } from "@tanstack/react-router";
import { Check, Zap } from "lucide-react";
import type { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { session, isStepCompleted, isStepActive } = useWizard();

  const currentStepMeta = WIZARD_STEPS.find(
    (s) => s.id === session.currentStep,
  );
  const currentStepIndex = WIZARD_STEPS.findIndex(
    (s) => s.id === session.currentStep,
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* ── Sidebar ────────────────────────────────────── */}
      <aside
        className="w-[260px] flex-shrink-0 flex flex-col bg-sidebar border-r border-sidebar-border"
        data-ocid="layout.sidebar"
      >
        {/* Branding */}
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-display font-semibold text-sm text-sidebar-foreground leading-tight">
                TeleportMigrator
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight tracking-wider uppercase">
                Migration Wizard
              </p>
            </div>
          </div>
        </div>

        {/* Step navigation */}
        <nav className="flex-1 py-4 px-3 space-y-0.5" aria-label="Wizard steps">
          {WIZARD_STEPS.map((step, i) => {
            const completed = isStepCompleted(step.id);
            const active = isStepActive(step.id);
            const upcoming = !completed && !active;

            return (
              <div key={step.id} className="relative">
                {/* Vertical connector */}
                {i < WIZARD_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "absolute left-[18px] top-9 w-px",
                      "h-[calc(100%+2px)]",
                      completed ? "bg-primary/40" : "bg-sidebar-border",
                    )}
                  />
                )}

                <Link
                  to={step.path}
                  data-ocid={`sidebar.step.${i + 1}`}
                  className={cn(
                    "relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors-fast",
                    active && "bg-primary/12 text-primary font-medium",
                    completed &&
                      !active &&
                      "text-sidebar-foreground hover:bg-sidebar-accent",
                    upcoming &&
                      "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {/* Step bubble */}
                  <div
                    className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold border transition-smooth",
                      active && "bg-primary/15 border-primary text-primary",
                      completed &&
                        "bg-primary border-primary text-primary-foreground",
                      upcoming &&
                        "bg-transparent border-border text-muted-foreground",
                    )}
                  >
                    {completed ? (
                      <Check className="w-3 h-3" strokeWidth={2.5} />
                    ) : (
                      <span>{i + 1}</span>
                    )}
                  </div>

                  <span className="min-w-0 truncate">{step.label}</span>

                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-sidebar-border">
          <p className="text-[10px] text-muted-foreground">
            © {new Date().getFullYear()}{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors-fast"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </aside>

      {/* ── Main area ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header
          className="h-14 flex items-center justify-between px-6 border-b border-border bg-card flex-shrink-0"
          data-ocid="layout.header"
        >
          <div>
            <h1 className="font-display font-semibold text-base text-foreground">
              {currentStepMeta?.label ?? "Migration"}
            </h1>
            <p className="text-xs text-muted-foreground">
              Step {currentStepIndex + 1} of {WIZARD_STEPS.length}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <WizardStepIndicator currentStep={session.currentStep} />
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto p-6" data-ocid="layout.main">
          {children}
        </main>
      </div>
    </div>
  );
}
