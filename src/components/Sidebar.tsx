import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  return (
    <aside className="sidebar">
      <h1 className="logo">QueueCare</h1>
      <nav>
        <NavLink to="/doctor" end className={({ isActive }) => (isActive ? "active" : "")}>
  Dashboard
</NavLink>
        <NavLink to="/queue" className={({ isActive }) => (isActive ? "active" : "")}>
          Queue
        </NavLink>
        <NavLink to="/patients" className={({ isActive }) => (isActive ? "active" : "")}>
          Patients
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")}>
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;