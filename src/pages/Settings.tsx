import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import { requireDb } from "../firebase";
import "./Settings.css";
import Footer from "../components/Footer";
function Settings() {
  const navigate = useNavigate();
  const { logout, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: "", phone: "", email: "", degree: "", specialization: "", experience: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        phone: profile.phone,
        email: profile.email,
        degree: profile.degree,
        specialization: profile.specialization,
        experience: profile.experience,
      });
    }
  }, [profile]);

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (!profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(requireDb(), "users", profile.id), { ...form });
      await refreshProfile();
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  if (!profile) return null;

  return (
    <div className="dashboard">
      <Sidebar />
      <main className="dashboard-content">
        <div className="top-bar">
          <div>
            <h2>Doctor Profile</h2>
            <p>Manage your account and personal details</p>
          </div>
          <button className="logout-btn" onClick={() => void handleLogout()}>
            Logout
          </button>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">{form.name.split(" ").map((n) => n[0]).join("")}</div>

          <div className="profile-fields">
            <div className="field-group">
              <label>Full Name</label>
              <input value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
            </div>
            <div className="field-group">
              <label>Phone Number</label>
              <input value={form.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>
            <div className="field-group">
              <label>Email</label>
              <input value={form.email} onChange={(e) => handleChange("email", e.target.value)} />
            </div>
            <div className="field-group">
              <label>Degree</label>
              <input value={form.degree} onChange={(e) => handleChange("degree", e.target.value)} />
            </div>
            <div className="field-group">
              <label>Specialization</label>
              <input value={form.specialization} onChange={(e) => handleChange("specialization", e.target.value)} />
            </div>
            <div className="field-group">
              <label>Experience</label>
              <input value={form.experience} onChange={(e) => handleChange("experience", e.target.value)} />
            </div>
          </div>
        </div>

        <button className="save-btn" onClick={() => void handleSave()} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      <Footer />
      </main>
    </div>
  );
}

export default Settings;