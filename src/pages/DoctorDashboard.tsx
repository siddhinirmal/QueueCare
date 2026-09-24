import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { listenToDoctorQueue, startNext, completeEntry } from "../lib/queue";
import type { QueueEntry } from "../types";
import "./DoctorDashboard.css";

function DoctorDashboard() {
  const { profile } = useAuth();
  const [entries, setEntries] = useState<QueueEntry[]>([]);

  useEffect(() => {
    if (!profile) return;
    return listenToDoctorQueue(profile.id, setEntries);
  }, [profile]);

  if (!profile) return null;

  const waiting = entries.filter((e) => e.status === "waiting");
  const current = entries.find((e) => e.status === "in-progress") ?? null;
  const completedToday = entries.filter((e) => e.status === "done").length;

  async function handleCallNext() {
    if (current) await completeEntry(current);
    const next = [...waiting].sort((a, b) => a.tokenNumber - b.tokenNumber)[0];
    if (next) await startNext(next.id);
  }

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="dashboard-content">
        <div className="top-bar">
          <div>
            <h2>Good Morning, Doctor</h2>
            <p>Here's your queue for today.</p>
          </div>
          <div className="doctor-name">{profile.name}</div>
        </div>

        <div className="stats">
          <div className="stat-card"><h3>Patients Waiting</h3><strong>{waiting.length}</strong></div>
          <div className="stat-card"><h3>Now Serving</h3><strong>{current ? `#${current.tokenNumber}` : "—"}</strong></div>
          <div className="stat-card"><h3>Completed Today</h3><strong>{completedToday}</strong></div>
        </div>

        <div className="current-patient">
          <p>Now Seeing</p>
          <h1>{current ? current.patientName : "No one yet"}</h1>
          <button
            className="next-button"
            onClick={() => void handleCallNext()}
            disabled={waiting.length === 0 && !current}
          >
            {current ? "Complete & Call Next" : "Call Next Patient"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default DoctorDashboard;