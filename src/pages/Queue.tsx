import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { listenToDoctorQueue, startNext, completeEntry } from "../lib/queue";
import type { QueueEntry } from "../types";
import "./Queue.css";

function Queue() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<QueueEntry[]>([]);

  useEffect(() => {
    if (!profile) return;
    return listenToDoctorQueue(profile.id, setEntries);
  }, [profile]);

  if (!profile) return null;

  async function advance(entry: QueueEntry) {
    if (entry.status === "waiting") await startNext(entry.id);
    else if (entry.status === "in-progress") await completeEntry(entry);
  }

  const active = entries.filter((e) => e.status !== "done");

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="dashboard-content">
        <div className="top-bar">
          <div><h2>Today's Queue</h2><p>{active.length} patients waiting</p></div>
        </div>

        <div className="queue-list">
          {active.length === 0 && <p>No patients in the queue right now.</p>}
          {active.map((entry) => (
            <div key={entry.id} className={`queue-card ${entry.status}`}>
              <div className="queue-card-info">
                <h3>{entry.patientName}</h3>
                <p>{entry.reason}</p>
              </div>
              <div className="queue-card-meta">
                <span className={`status-badge ${entry.status}`}>{entry.status.replace("-", " ")}</span>
                <button onClick={() => void advance(entry)}>
                  {entry.status === "waiting" ? "Start" : "Complete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default Queue;