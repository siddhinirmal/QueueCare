import {
  addDoc, collection, doc, getDocs, limit, onSnapshot, orderBy, query,
  updateDoc, where,
} from "firebase/firestore";
import { requireDb } from "../firebase";
import type { QueueEntry, QueueStatus, Visit, NotificationItem } from "../types";

const MINUTES_PER_PATIENT = 10;
const WARN_THRESHOLD_MINUTES = 10;

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
    isEmergency: Boolean(data.isEmergency ?? false),
    notifiedTenMin: Boolean(data.notifiedTenMin ?? false),
    createdAtMs: Number(data.createdAtMs ?? 0),
    calledAtMs: data.calledAtMs != null ? Number(data.calledAtMs) : null,
    completedAtMs: data.completedAtMs != null ? Number(data.completedAtMs) : null,
  };
}

async function notifyPatient(patientId: string, message: string) {
  await addDoc(collection(requireDb(), "notifications"), {
    patientId,
    message,
    createdAtMs: Date.now(),
  } satisfies Omit<NotificationItem, "id">);
}

export async function findAnyDoctor(): Promise<{ id: string; name: string } | null> {
  const snap = await getDocs(
    query(collection(requireDb(), "users"), where("role", "==", "doctor"), limit(1))
  );
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, name: String(d.data().name ?? "Doctor") };
}function startOfTodayMs(): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now.getTime();
}

export async function joinQueue(patientId: string, patientName: string, reason: string) {
  const doctor = await findAnyDoctor();
  if (!doctor) throw new Error("No doctor available right now.");

  const lastSnap = await getDocs(
    query(
      collection(requireDb(), "queueEntries"),
      where("doctorId", "==", doctor.id),
      where("createdAtMs", ">=", startOfTodayMs()),
      orderBy("createdAtMs", "desc")
    )
  );

  const todaysTokens = lastSnap.docs.map((d) => Number(d.data().tokenNumber ?? 0));
  const nextToken = todaysTokens.length === 0 ? 1 : Math.max(...todaysTokens) + 1;

  await addDoc(collection(requireDb(), "queueEntries"), {
    patientId,
    patientName,
    doctorId: doctor.id,
    doctorName: doctor.name,
    tokenNumber: nextToken,
    reason: reason || "General visit",
    status: "waiting" as QueueStatus,
    isEmergency: false,
    notifiedTenMin: false,
    createdAtMs: Date.now(),
    calledAtMs: null,
    completedAtMs: null,
  });
}

function sortQueue(entries: QueueEntry[]): QueueEntry[] {
  return [...entries].sort((a, b) => {
    if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
    return a.tokenNumber - b.tokenNumber;
  });
}

export function listenToDoctorQueue(doctorId: string, cb: (entries: QueueEntry[]) => void) {
  const q = query(collection(requireDb(), "queueEntries"), where("doctorId", "==", doctorId));
  return onSnapshot(q, (snap) => {
    const entries = snap.docs.map((d) => toQueueEntry(d.id, d.data()));
    cb(sortQueue(entries));
  });
}

/**
 * Listens to the patient's own active entry AND the full doctor queue it
 * belongs to, so it can compute "people ahead" / estimated wait live and
 * fire the one-time 10-minute warning automatically. Returns a single
 * unsubscribe function.
 */
export function listenToPatientActiveEntry(
  patientId: string,
  cb: (entry: QueueEntry | null, peopleAhead: number) => void
) {
  let unsubDoctorQueue: (() => void) | null = null;

  const unsubPatient = onSnapshot(
    query(
      collection(requireDb(), "queueEntries"),
      where("patientId", "==", patientId),
      where("status", "in", ["waiting", "in-progress"])
    ),
    (snap) => {
      if (unsubDoctorQueue) {
        unsubDoctorQueue();
        unsubDoctorQueue = null;
      }

      if (snap.empty) {
        cb(null, 0);
        return;
      }

      const entries = snap.docs.map((d) => toQueueEntry(d.id, d.data()));
      entries.sort((a, b) => b.createdAtMs - a.createdAtMs);
      const entry = entries[0];

      unsubDoctorQueue = listenToDoctorQueue(entry.doctorId, (doctorEntries) => {
        const peopleAhead = doctorEntries.filter(
          (e) => e.status === "waiting" && e.tokenNumber < entry.tokenNumber
        ).length;

        const estimatedWaitMin = peopleAhead * MINUTES_PER_PATIENT;
        if (
          entry.status === "waiting" &&
          !entry.notifiedTenMin &&
          estimatedWaitMin <= WARN_THRESHOLD_MINUTES
        ) {
          void updateDoc(doc(requireDb(), "queueEntries", entry.id), { notifiedTenMin: true });
          void notifyPatient(
            entry.patientId,
            "Your turn is coming up in about 10 minutes — please head to the waiting area."
          );
        }

        cb(entry, peopleAhead);
      });
    }
  );

  return () => {
    unsubPatient();
    if (unsubDoctorQueue) unsubDoctorQueue();
  };
}

export async function startNext(entry: QueueEntry) {
  await updateDoc(doc(requireDb(), "queueEntries", entry.id), {
    status: "in-progress" as QueueStatus,
    calledAtMs: Date.now(),
  });

  await notifyPatient(entry.patientId, "It's your turn now! Please proceed to the doctor.");

  const waitingSnap = await getDocs(
    query(
      collection(requireDb(), "queueEntries"),
      where("doctorId", "==", entry.doctorId),
      where("status", "==", "waiting")
    )
  );
  const waitingEntries = sortQueue(waitingSnap.docs.map((d) => toQueueEntry(d.id, d.data())));
  const next = waitingEntries[0];
  if (next) {
    await notifyPatient(next.patientId, "You're next in line! Please get ready.");
  }
}

export async function markEmergency(entryId: string) {
  await updateDoc(doc(requireDb(), "queueEntries", entryId), { isEmergency: true });
}

export async function unmarkEmergency(entryId: string) {
  await updateDoc(doc(requireDb(), "queueEntries", entryId), { isEmergency: false });
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