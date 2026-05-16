// Wizard step identifiers
export type WizardStep = "auth" | "scan" | "preview" | "execute" | "done";

export const WIZARD_STEPS: { id: WizardStep; label: string; path: string }[] = [
  { id: "auth", label: "Authentication", path: "/" },
  { id: "scan", label: "Account Scanner", path: "/scan" },
  { id: "preview", label: "Transfer Preview", path: "/preview" },
  { id: "execute", label: "Live Progress", path: "/execute" },
  { id: "done", label: "Completion", path: "/done" },
];

export const STEP_ORDER: WizardStep[] = [
  "auth",
  "scan",
  "preview",
  "execute",
  "done",
];

// Authentication
export type AuthStatus = "idle" | "pending" | "verified" | "error";

export interface AuthState {
  phone: string;
  sessionHash: string;
  status: AuthStatus;
  error?: string;
}

// Scanned account items
export type AccountItemType =
  | "channel"
  | "group"
  | "chat"
  | "bot"
  | "folder"
  | "supergroup";

export interface AccountItem {
  id: string;
  name: string;
  type: AccountItemType;
  memberCount?: number;
  subscriberCount?: number;
  username?: string;
  lastActivity?: string;
  selected: boolean;
}

// Transfer
export type TransferStatus =
  | "pending"
  | "in_progress"
  | "completed"
  | "failed"
  | "skipped";

export interface TransferJob {
  id: string;
  sessionId: string;
  createdAt: string;
  status: TransferStatus;
  totalItems: number;
  completedItems: number;
  failedItems: number;
  currentItemName?: string;
}

export interface TransferLogEntry {
  id: string;
  jobId: string;
  itemId: string;
  itemName: string;
  itemType: AccountItemType;
  status: TransferStatus;
  message: string;
  timestamp: string;
}

// Session
export interface MigrationSession {
  id: string;
  createdAt: string;
  accountAAuth: AuthState | null;
  accountBAuth: AuthState | null;
  scannedItems: AccountItem[];
  selectedItems: string[];
  transferJobId?: string;
  transferLogs: TransferLogEntry[];
  currentStep: WizardStep;
}
