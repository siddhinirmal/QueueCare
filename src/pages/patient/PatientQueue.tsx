import { useEffect, useState } from "react";
import PatientSidebar from "../../components/PatientSidebar";
import { useAuth } from "../../context/AuthContext";
import { listenToPatientActiveEntry, listenToDoctorQueue } from "../../lib/queue";
import type { QueueEntry } from "../../types";
import "./PatientQueue.css";
import Footer from "../../components/Footer";
function PatientQueue() {
  const { profile } = useAuth();
  const [entry, setEntry] = useState<QueueEntry | null>(null);
  const [doctorQueue, setDoctorQueue] = useState<QueueEntry[]>([]);

 useEffect(() => {
  if (!profile) return;
  return listenToPatientActiveEntry(profile.id, (nextEntry) => setEntry(nextEntry));
}, [profile]);

  useEffect(() => {
    if (!entry) {
      setDoctorQueue([]);
      return;
    }
    return listenToDoctorQueue(entry.doctorId, setDoctorQueue);
  }, [entry]);

  if (!profile) return null;

  if (!entry) {
    return (
      <div className="dashboard">
        <PatientSidebar />
        <main className="dashboard-content">
          <div className="top-bar">
            <div>
              <h2>My Queue</h2>
              <p>You're not currently in a queue. Join one from Home.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const peopleAhead = doctorQueue.filter(
    (e) => e.status === "waiting" && e.tokenNumber < entry.tokenNumber
  ).length;
  const calledHistory = doctorQueue
    .filter((e) => e.calledAtMs != null)
    .sort((a, b) => (b.calledAtMs ?? 0) - (a.calledAtMs ?? 0))
    .slice(0, 5);

  return (
    <div className="dashboard">
      <PatientSidebar />
      <main className="dashboard-content">
        <div className="top-bar">
          <div>
            <h2>My Queue</h2>
            <p>Live status for your appointment with {entry.doctorName}</p>
          </div>
        </div>

        <div className="queue-status-card">
          <div className="queue-status-token">
            <p>Your Token</p>
            <h1>#{entry.tokenNumber}</h1>
            <span className={`status-badge ${entry.status}`}>{entry.status}</span>
          </div>
          <div className="queue-status-details">
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
          <h3>Recently Called</h3>
          <table className="history-table">
            <thead><tr><th>Token</th><th>Time Called</th></tr></thead>
            <tbody>
              {calledHistory.length === 0 && <tr><td colSpan={2}>No one has been called yet.</td></tr>}
              {calledHistory.map((e) => (
                <tr key={e.id}>
                  <td>#{e.tokenNumber}</td>
                  <td>{e.calledAtMs ? new Date(e.calledAtMs).toLocaleTimeString() : "—"}</td>
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

export default PatientQueue;