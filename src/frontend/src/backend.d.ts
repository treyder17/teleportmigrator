import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type WizardStep = bigint;
export interface ItemProgress {
    status: JobStatus;
    itemId: ItemId;
    errorMessage?: string;
    itemName: string;
    itemType: ItemType;
    progressPct: bigint;
}
export type Timestamp = bigint;
export interface TransferJob {
    id: JobId;
    status: JobStatus;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    sessionId: SessionId;
    items: Array<ItemProgress>;
}
export interface Session {
    id: SessionId;
    createdAt: Timestamp;
    step: WizardStep;
    updatedAt: Timestamp;
    accountA: AuthState;
    accountB: AuthState;
}
export interface LogEntry {
    startTime: Timestamp;
    status: JobStatus;
    itemId: ItemId;
    endTime?: Timestamp;
    errorMessage?: string;
    itemName: string;
    itemType: ItemType;
}
export type ItemId = string;
export interface AccountItem {
    id: ItemId;
    name: string;
    memberCount: bigint;
    itemType: ItemType;
    selected: boolean;
    subscriberCount: bigint;
}
export type JobId = string;
export type SessionId = string;
export interface AuthState {
    sessionString: string;
    verified: boolean;
    phone: string;
}
export enum ItemType {
    bot = "bot",
    chat = "chat",
    group = "group",
    channel = "channel",
    folder = "folder"
}
export enum JobStatus {
    pending = "pending",
    complete = "complete",
    failed = "failed",
    running = "running"
}
export interface backendInterface {
    addLogEntry(sessionId: SessionId, entry: LogEntry): Promise<void>;
    createSession(): Promise<SessionId>;
    createTransferJob(sessionId: SessionId): Promise<JobId | null>;
    getScannedItems(sessionId: SessionId): Promise<Array<AccountItem>>;
    getSession(sessionId: SessionId): Promise<Session | null>;
    getTransferJob(jobId: JobId): Promise<TransferJob | null>;
    getTransferLogs(sessionId: SessionId): Promise<Array<LogEntry>>;
    listTransferJobs(sessionId: SessionId): Promise<Array<TransferJob>>;
    scanAccountA(sessionId: SessionId): Promise<Array<AccountItem>>;
    selectAllItems(sessionId: SessionId, selected: boolean): Promise<boolean>;
    setAccountAAuth(sessionId: SessionId, auth: AuthState): Promise<boolean>;
    setAccountBAuth(sessionId: SessionId, auth: AuthState): Promise<boolean>;
    setWizardStep(sessionId: SessionId, step: WizardStep): Promise<boolean>;
    toggleItemSelection(sessionId: SessionId, itemId: ItemId): Promise<boolean>;
    updateItemProgress(jobId: JobId, itemId: ItemId, status: JobStatus, progressPct: bigint, errorMessage: string | null): Promise<boolean>;
    updateJobStatus(jobId: JobId, status: JobStatus): Promise<boolean>;
}
