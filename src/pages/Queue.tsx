import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { listenToDoctorQueue, startNext, completeEntry, markEmergency, unmarkEmergency } from "../lib/queue";
import type { QueueEntry } from "../types";
import "./Queue.css";
import Footer from "../components/Footer";

function Queue() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<QueueEntry[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    return listenToDoctorQueue(profile.id, setEntries);
  }, [profile]);

  if (!profile) return null;

  async function advance(entry: QueueEntry) {
    if (entry.status === "waiting") await startNext(entry);
    else if (entry.status === "in-progress") await completeEntry(entry);
  }

  async function toggleEmergency(entry: QueueEntry) {
    setOpenMenuId(null);
    if (entry.isEmergency) await unmarkEmergency(entry.id);
    else await markEmergency(entry.id);
  }

  const active = entries.filter((e) => e.status !== "done");

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="dashboard-content">
        <div className="top-bar">
          <div>
            <h2>Today's Queue</h2>
            <p>{active.length} patients waiting</p>
          </div>
        </div>

        <div className="queue-list">
          {active.length === 0 && <p>No patients in the queue right now.</p>}
          {active.map((entry) => (
            <div
              key={entry.id}
              className={`queue-card ${entry.status} ${entry.isEmergency ? "emergency" : ""}`}
            >
              <div className="queue-card-info">
                <h3>
                  {entry.isEmergency && <span className="emergency-tag">EMERGENCY</span>}
                  {entry.patientName}
                </h3>
                <p>{entry.reason}</p>
              </div>
              <div className="queue-card-meta">
                <span className={`status-badge ${entry.status}`}>
                  {entry.status.replace("-", " ")}
                </span>
                <button onClick={() => void advance(entry)}>
                  {entry.status === "waiting" ? "Start" : "Complete"}
                </button>

                <div className="menu-wrapper">
                  <button
                    className="menu-dots"
                    onClick={() => setOpenMenuId(openMenuId === entry.id ? null : entry.id)}
                  >
                    ⋮
                  </button>
                  {openMenuId === entry.id && (
                    <div className="menu-dropdown">
                      <button onClick={() => void toggleEmergency(entry)}>
                        {entry.isEmergency ? "Remove Emergency Status" : "Mark as Emergency"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Footer />
      </main>
    </div>
  );
}

export default Queue;