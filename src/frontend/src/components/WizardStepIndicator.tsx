import { cn } from "@/lib/utils";
import { STEP_ORDER, WIZARD_STEPS } from "@/types";
import type { WizardStep } from "@/types";
import { Check } from "lucide-react";

interface Props {
  currentStep: WizardStep;
}

export function WizardStepIndicator({ currentStep }: Props) {
  const currentIndex = STEP_ORDER.indexOf(currentStep);

  return (
    <div
      className="flex items-center gap-0"
      aria-label="Migration wizard progress"
    >
      {WIZARD_STEPS.map((step, i) => {
        const isCompleted = i < currentIndex;
        const isActive = i === currentIndex;
        const isUpcoming = i > currentIndex;

        return (
          <div key={step.id} className="flex items-center">
            {/* Step bubble */}
            <div
              data-ocid={`wizard-indicator.step.${i + 1}`}
              className={cn(
                "relative flex items-center justify-center rounded-full text-xs font-semibold transition-smooth",
                "w-7 h-7 border",
                isCompleted &&
                  "bg-primary border-primary text-primary-foreground",
                isActive &&
                  "bg-primary/15 border-primary text-primary glow-primary",
                isUpcoming &&
                  "bg-transparent border-border text-muted-foreground",
              )}
              aria-current={isActive ? "step" : undefined}
            >
              {isCompleted ? (
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              ) : (
                <span>{i + 1}</span>
              )}
            </div>

            {/* Connector line */}
            {i < WIZARD_STEPS.length - 1 && (
              <div
                className={cn(
                  "w-8 h-px transition-smooth",
                  i < currentIndex ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
