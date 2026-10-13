import { useEffect, useRef, useState } from "react";
import PatientSidebar from "../../components/PatientSidebar";
import { useAuth } from "../../context/AuthContext";
import {
  joinQueue, listenToPatientActiveEntry, listenToPatientVisits,
  listenToPatientNotifications,
} from "../../lib/queue";
import { requestNotificationPermission, showBrowserNotification } from "../../lib/browserNotify";
import type { QueueEntry, Visit, NotificationItem } from "../../types";
import "./PatientHome.css";
import Footer from "../../components/Footer";
function PatientHome() {
  const { profile } = useAuth();
  const [entry, setEntry] = useState<QueueEntry | null>(null);
  const [peopleAhead, setPeopleAhead] = useState(0);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [joining, setJoining] = useState(false);
  const [reason, setReason] = useState("");

  const seenNotificationIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (!profile) return;

    const unsub = listenToPatientActiveEntry(profile.id, (nextEntry, nextPeopleAhead) => {
      setEntry(nextEntry);
      setPeopleAhead(nextPeopleAhead);
    });

    const unsubVisits = listenToPatientVisits(profile.id, setVisits);

    const unsubNotifs = listenToPatientNotifications(profile.id, (items) => {
      if (seenNotificationIds.current === null) {
        // First load: just remember what's already there, don't pop these.
        seenNotificationIds.current = new Set(items.map((n) => n.id));
      } else {
        for (const item of items) {
          if (!seenNotificationIds.current.has(item.id)) {
            seenNotificationIds.current.add(item.id);
            showBrowserNotification("QueueCare", item.message);
          }
        }
      }
      setNotifications(items);
    });

    return () => {
      unsub();
      unsubVisits();
      unsubNotifs();
    };
  }, [profile]);

  async function handleJoin() {
    if (!profile) return;
    setJoining(true);
    try {
      await joinQueue(profile.id, profile.name, reason);
      setReason("");
    } finally {
      setJoining(false);
    }
  }

  if (!profile) return null;

  return (
    <div className="dashboard">
      <PatientSidebar />
      <main className="dashboard-content">
        <div className="top-bar">
          <div>
            <h2>Hello, {profile.name}</h2>
            <p>Here's your current status.</p>
          </div>
        </div>

        {entry ? (
          <>
            <div className="status-card">
              <div className="status-token">
                <p>Your Token</p>
                <h1>#{entry.tokenNumber}</h1>
                <span className={`status-badge ${entry.status}`}>{entry.status}</span>
              </div>
              <div className="status-details">
                <div className="status-detail-item">
                  <span className="detail-label">People ahead</span>
                  <span className="detail-value">{peopleAhead}</span>
                </div>
                <div className="status-detail-item">
                  <span className="detail-label">Estimated wait</span>
                  <span className="detail-value">{peopleAhead * 10} min</span>
                </div>
              </div>
            </div>

            <div className="panel">
  <h3>Your Doctor</h3>
  <div className="doctor-info">
    <div className="doctor-avatar">
      {entry.doctorName.split(" ").map((n) => n[0]).join("")}
    </div>
    <div>
      <p className="doctor-name-text">{entry.doctorName}</p>
    </div>
  </div>
</div>
          </>
        ) : (
          <div className="panel">
            <h3>Join the Queue</h3>
            <p>You're not currently in a queue.</p>
            <input
              placeholder="Reason for visit (optional)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ margin: "12px 0", padding: "8px", width: "100%" }}
            />
            <button className="save-btn" onClick={() => void handleJoin()} disabled={joining}>
              {joining ? "Joining..." : "Join Queue"}
            </button>
          </div>
        )}

        <div className="panel">
          <h3>Recent Visit History</h3>
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Doctor</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {visits.length === 0 && <tr><td colSpan={3}>No visits yet.</td></tr>}
              {visits.map((visit) => (
                <tr key={visit.id}>
                  <td>{new Date(visit.dateMs).toLocaleDateString()}</td>
                  <td>{visit.doctorName}</td>
                  <td>{visit.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Footer/>
      </main>
    </div>
  );
}

export default PatientHome;