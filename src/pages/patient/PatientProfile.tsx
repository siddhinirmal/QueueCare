import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import PatientSidebar from "../../components/PatientSidebar";
import { useAuth } from "../../context/AuthContext";
import { requireDb } from "../../firebase";
import "./PatientProfile.css";
import Footer from "../../components/Footer";
function PatientProfile() {
  const navigate = useNavigate();
  const { logout, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    name: "", age: "", phone: "", email: "", bloodGroup: "", allergies: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name,
        age: profile.age,
        phone: profile.phone,
        email: profile.email,
        bloodGroup: profile.bloodGroup,
        allergies: profile.allergies,
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
      <PatientSidebar />
      <main className="dashboard-content">
        <div className="top-bar">
          <div>
            <h2>My Profile</h2>
            <p>Manage your personal information</p>
          </div>
          <button className="logout-btn" onClick={() => void handleLogout()}>
            Logout
          </button>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">
            {form.name.split(" ").map((n) => n[0]).join("")}
          </div>

          <div className="profile-fields">
            <div className="field-group">
              <label>Full Name</label>
              <input value={form.name} onChange={(e) => handleChange("name", e.target.value)} />
            </div>
            <div className="field-group">
              <label>Age</label>
              <input value={form.age} onChange={(e) => handleChange("age", e.target.value)} />
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
              <label>Blood Group</label>
              <input value={form.bloodGroup} onChange={(e) => handleChange("bloodGroup", e.target.value)} />
            </div>
            <div className="field-group">
              <label>Known Allergies</label>
              <input value={form.allergies} onChange={(e) => handleChange("allergies", e.target.value)} />
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

export default PatientProfile;