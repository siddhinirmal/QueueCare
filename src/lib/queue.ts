import {
  addDoc, collection, doc, getDocs, limit, onSnapshot, orderBy, query,
  updateDoc, where,
} from "firebase/firestore";
import { requireDb } from "../firebase";
import type { QueueEntry, QueueStatus, Visit, NotificationItem } from "../types";

function toQueueEntry(id: string, data: Record<string, unknown>): QueueEntry {
  return {
    id,
    patientId: String(data.patientId ?? ""),
    patientName: String(data.patientName ?? ""),
    doctorId: String(data.doctorId ?? ""),
    doctorName: String(data.doctorName ?? ""),
    tokenNumber: Number(data.tokenNumber ?? 0),
    reason: String(data.reason ?? ""),
    status: (data.status as QueueStatus) ?? "waiting",
    createdAtMs: Number(data.createdAtMs ?? 0),
    calledAtMs: data.calledAtMs != null ? Number(data.calledAtMs) : null,
    completedAtMs: data.completedAtMs != null ? Number(data.completedAtMs) : null,
  };
}

export async function findAnyDoctor(): Promise<{ id: string; name: string } | null> {
  const snap = await getDocs(
    query(collection(requireDb(), "users"), where("role", "==", "doctor"), limit(1))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, name: String(d.data().name ?? "Doctor") };
}

export async function joinQueue(patientId: string, patientName: string, reason: string) {
  const doctor = await findAnyDoctor();
  if (!doctor) throw new Error("No doctor available right now.");

  const lastSnap = await getDocs(
    query(
      collection(requireDb(), "queueEntries"),
      where("doctorId", "==", doctor.id),
      orderBy("tokenNumber", "desc"),
      limit(1)
    )
  );
  const nextToken = lastSnap.empty ? 1 : Number(lastSnap.docs[0].data().tokenNumber ?? 0) + 1;

  await addDoc(collection(requireDb(), "queueEntries"), {
    patientId,
    patientName,
    doctorId: doctor.id,
    doctorName: doctor.name,
    tokenNumber: nextToken,
    reason: reason || "General visit",
    status: "waiting" as QueueStatus,
    createdAtMs: Date.now(),
    calledAtMs: null,
    completedAtMs: null,
  });
}

export function listenToPatientActiveEntry(
  patientId: string,
  cb: (entry: QueueEntry | null) => void
) {
  const q = query(
    collection(requireDb(), "queueEntries"),
    where("patientId", "==", patientId),
    where("status", "in", ["waiting", "in-progress"])
  );
  return onSnapshot(q, (snap) => {
    if (snap.empty) return cb(null);
    const entries = snap.docs.map((d) => toQueueEntry(d.id, d.data()));
    entries.sort((a, b) => b.createdAtMs - a.createdAtMs);
    cb(entries[0]);
  });
}

export function listenToDoctorQueue(doctorId: string, cb: (entries: QueueEntry[]) => void) {
  const q = query(collection(requireDb(), "queueEntries"), where("doctorId", "==", doctorId));
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((d) => toQueueEntry(d.id, d.data()));
    entries.sort((a, b) => a.tokenNumber - b.tokenNumber);
    cb(entries);
  });
}

export async function startNext(entryId: string) {
  await updateDoc(doc(requireDb(), "queueEntries", entryId), {
    status: "in-progress" as QueueStatus,
    calledAtMs: Date.now(),
  });
}

export async function completeEntry(entry: QueueEntry) {
  await updateDoc(doc(requireDb(), "queueEntries", entry.id), {
    status: "done" as QueueStatus,
    completedAtMs: Date.now(),
  });
  await addDoc(collection(requireDb(), "visits"), {
    patientId: entry.patientId,
    doctorId: entry.doctorId,
    doctorName: entry.doctorName,
    reason: entry.reason,
    dateMs: Date.now(),
  } satisfies Omit<Visit, "id">);
}

export function listenToPatientVisits(patientId: string, cb: (visits: Visit[]) => void) {
  const q = query(
    collection(requireDb(), "visits"),
    where("patientId", "==", patientId),
    orderBy("dateMs", "desc"),
    limit(5)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Visit, "id">) })));
  });
}

export function listenToPatientNotifications(
  patientId: string,
  cb: (items: NotificationItem[]) => void
) {
  const q = query(
    collection(requireDb(), "notifications"),
    where("patientId", "==", patientId),
    orderBy("createdAtMs", "desc"),
    limit(5)
  );
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<NotificationItem, "id">) })));
  });
}