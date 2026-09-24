import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import { requireDb } from "../firebase";
import "./Patients.css";

interface PatientRow {
  id: string;
  name: string;
  age: string;
  email: string;
  bloodGroup: string;
}

function Patients() {
  const [search, setSearch] = useState("");
  const [patients, setPatients] = useState<PatientRow[]>([]);

  useEffect(() => {
    async function load() {
      const q = query(collection(requireDb(), "users"), where("role", "==", "patient"));
      const snap = await getDocs(q);
      setPatients(
        snap.docs.map((d) => ({
          id: d.id,
          name: String(d.data().name ?? ""),
          age: String(d.data().age ?? ""),
          email: String(d.data().email ?? ""),
          bloodGroup: String(d.data().bloodGroup ?? ""),
        }))
      );
    }
    void load();
  }, []);

  const filtered = patients.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="dashboard-content">
        <div className="top-bar">
          <div>
            <h2>Patients</h2>
            <p>{patients.length} total patients on record</p>
          </div>
        </div>

        <div className="search-wrapper">
          <input
            className="patient-search"
            type="text"
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table className="patients-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Email</th>
              <th>Blood Group</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.age}</td>
                <td>{p.email}</td>
                <td>{p.bloodGroup}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}

export default Patients;