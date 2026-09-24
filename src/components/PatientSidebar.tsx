import { NavLink } from "react-router-dom";
import "./PatientSidebar.css";

function PatientSidebar() {
  return (
    <aside className="sidebar">
      <h1 className="logo">QueueCare</h1>
      <nav>
        <NavLink to="/patient" end className={({ isActive }) => (isActive ? "active" : "")}>
          Home
        </NavLink>
        <NavLink to="/patient/queue" className={({ isActive }) => (isActive ? "active" : "")}>
          My Queue
        </NavLink>
        <NavLink to="/patient/profile" className={({ isActive }) => (isActive ? "active" : "")}>
          Profile
        </NavLink>
      </nav>
    </aside>
  );
}

export default PatientSidebar;