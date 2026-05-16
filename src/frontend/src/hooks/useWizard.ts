import { WizardContext } from "@/context/WizardContext";
import { STEP_ORDER } from "@/types";
import type { WizardStep } from "@/types";
import { useContext } from "react";

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error("useWizard must be used inside <WizardProvider>");

  const { session } = ctx;

  const stepIndex = (step: WizardStep) => STEP_ORDER.indexOf(step);
  const currentIndex = stepIndex(session.currentStep);

  const isStepCompleted = (step: WizardStep) => stepIndex(step) < currentIndex;

  const isStepActive = (step: WizardStep) => step === session.currentStep;

  const canAdvance = (): boolean => {
    switch (session.currentStep) {
      case "auth":
        return (
          session.accountAAuth?.status === "verified" &&
          session.accountBAuth?.status === "verified"
        );
      case "scan":
        return session.scannedItems.length > 0;
      case "preview":
        return session.selectedItems.length > 0;
      case "execute":
        return !!session.transferJobId;
      default:
        return false;
    }
  };

  const nextStep = () => {
    const next = STEP_ORDER[currentIndex + 1];
    if (next) ctx.setCurrentStep(next);
  };

  const prevStep = () => {
    const prev = STEP_ORDER[currentIndex - 1];
    if (prev) ctx.setCurrentStep(prev);
  };

  return {
    ...ctx,
    isStepCompleted,
    isStepActive,
    canAdvance,
    nextStep,
    prevStep,
    currentIndex,
  };
}
