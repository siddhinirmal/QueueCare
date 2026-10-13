export type UserRole = "doctor" | "patient";

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone: string;
  degree: string;
  specialization: string;
  experience: string;
  age: string;
  bloodGroup: string;
  allergies: string;
}

export type QueueStatus = "waiting" | "in-progress" | "done" | "skipped";

export interface QueueEntry {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  tokenNumber: number;
  reason: string;
  status: QueueStatus;
  isEmergency: boolean;
  notifiedTenMin: boolean;
  createdAtMs: number;
  calledAtMs: number | null;
  completedAtMs: number | null;
}

export interface Visit {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  reason: string;
  dateMs: number;
}

export interface NotificationItem {
  id: string;
  patientId: string;
  message: string;
  createdAtMs: number;
}