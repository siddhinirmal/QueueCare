import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import RoleLayout from "./components/RoleLayout";
import DoctorDashboard from "./pages/DoctorDashboard";
import Queue from "./pages/Queue";
import Patients from "./pages/Patients";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import PatientHome from "./pages/patient/PatientHome";
import PatientQueue from "./pages/patient/PatientQueue";
import PatientProfile from "./pages/patient/PatientProfile";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RoleLayout role="doctor" />}>
            <Route path="/doctor" element={<DoctorDashboard />} />
            <Route path="/queue" element={<Queue />} />
            <Route path="/patients" element={<Patients />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route element={<RoleLayout role="patient" />}>
            <Route path="/patient" element={<PatientHome />} />
            <Route path="/patient/queue" element={<PatientQueue />} />
            <Route path="/patient/profile" element={<PatientProfile />} />
          </Route>

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
