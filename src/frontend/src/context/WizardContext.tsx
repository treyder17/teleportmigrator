import type {
  AccountItem,
  AuthState,
  MigrationSession,
  TransferLogEntry,
  WizardStep,
} from "@/types";
import { type ReactNode, createContext, useCallback, useState } from "react";

interface WizardContextValue {
  session: MigrationSession;
  setCurrentStep: (step: WizardStep) => void;
  setAccountAAuth: (auth: AuthState | null) => void;
  setAccountBAuth: (auth: AuthState | null) => void;
  setScannedItems: (items: AccountItem[]) => void;
  toggleItemSelected: (id: string) => void;
  selectAllItems: (selected: boolean) => void;
  setTransferJobId: (id: string) => void;
  addTransferLog: (log: TransferLogEntry) => void;
  resetSession: () => void;
}

const defaultSession: MigrationSession = {
  id: crypto.randomUUID(),
  createdAt: new Date().toISOString(),
  accountAAuth: null,
  accountBAuth: null,
  scannedItems: [],
  selectedItems: [],
  transferJobId: undefined,
  transferLogs: [],
  currentStep: "auth",
};

export const WizardContext = createContext<WizardContextValue | null>(null);

export function WizardProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MigrationSession>(defaultSession);

  const setCurrentStep = useCallback((step: WizardStep) => {
    setSession((s) => ({ ...s, currentStep: step }));
  }, []);

  const setAccountAAuth = useCallback((auth: AuthState | null) => {
    setSession((s) => ({ ...s, accountAAuth: auth }));
  }, []);

  const setAccountBAuth = useCallback((auth: AuthState | null) => {
    setSession((s) => ({ ...s, accountBAuth: auth }));
  }, []);

  const setScannedItems = useCallback((items: AccountItem[]) => {
    setSession((s) => ({ ...s, scannedItems: items, selectedItems: [] }));
  }, []);

  const toggleItemSelected = useCallback((id: string) => {
    setSession((s) => {
      const already = s.selectedItems.includes(id);
      return {
        ...s,
        selectedItems: already
          ? s.selectedItems.filter((i) => i !== id)
          : [...s.selectedItems, id],
      };
    });
  }, []);

  const selectAllItems = useCallback((selected: boolean) => {
    setSession((s) => ({
      ...s,
      selectedItems: selected ? s.scannedItems.map((i) => i.id) : [],
    }));
  }, []);

  const setTransferJobId = useCallback((id: string) => {
    setSession((s) => ({ ...s, transferJobId: id }));
  }, []);

  const addTransferLog = useCallback((log: TransferLogEntry) => {
    setSession((s) => ({ ...s, transferLogs: [...s.transferLogs, log] }));
  }, []);

  const resetSession = useCallback(() => {
    setSession({
      ...defaultSession,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    });
  }, []);

  return (
    <WizardContext.Provider
      value={{
        session,
        setCurrentStep,
        setAccountAAuth,
        setAccountBAuth,
        setScannedItems,
        toggleItemSelected,
        selectAllItems,
        setTransferJobId,
        addTransferLog,
        resetSession,
      }}
    >
      {children}
    </WizardContext.Provider>
  );
}
