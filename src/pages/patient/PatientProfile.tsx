import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PatientSidebar from "../../components/PatientSidebar";
import { useAuth } from "../../context/AuthContext";
import "./PatientProfile.css";

function PatientProfile() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState({
    name: "Aarav Sharma",
    age: "34",
    phone: "+91 91234 56789",
    email: "aarav.sharma@email.com",
    bloodGroup: "O+",
    allergies: "None reported",
  });

  function handleChange(field: string, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

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
            {profile.name.split(" ").map((n) => n[0]).join("")}
          </div>

          <div className="profile-fields">
            <div className="field-group">
              <label>Full Name</label>
              <input value={profile.name} onChange={(e) => handleChange("name", e.target.value)} />
            </div>
            <div className="field-group">
              <label>Age</label>
              <input value={profile.age} onChange={(e) => handleChange("age", e.target.value)} />
            </div>
            <div className="field-group">
              <label>Phone Number</label>
              <input value={profile.phone} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>
            <div className="field-group">
              <label>Email</label>
              <input value={profile.email} onChange={(e) => handleChange("email", e.target.value)} />
            </div>
            <div className="field-group">
              <label>Blood Group</label>
              <input value={profile.bloodGroup} onChange={(e) => handleChange("bloodGroup", e.target.value)} />
            </div>
            <div className="field-group">
              <label>Known Allergies</label>
              <input value={profile.allergies} onChange={(e) => handleChange("allergies", e.target.value)} />
            </div>
          </div>
        </div>

        <button className="save-btn">Save Changes</button>
      </main>
    </div>
  );
}

export default PatientProfile;