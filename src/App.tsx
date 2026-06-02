import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import CoachDashboard from "@/pages/CoachDashboard";
import ManagerDashboard from "@/pages/ManagerDashboard";
import Members from "@/pages/Members";
import TrainingPlan from "@/pages/TrainingPlan";
import BodyMeasurements from "@/pages/BodyMeasurements";
import Attendance from "@/pages/Attendance";
import LeaveRequests from "@/pages/LeaveRequests";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/coach" element={<CoachDashboard />} />
        <Route path="/manager" element={<ManagerDashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/training" element={<TrainingPlan />} />
        <Route path="/body-measurements" element={<BodyMeasurements />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/leave" element={<LeaveRequests />} />
        <Route path="/risks" element={<ManagerDashboard />} />
      </Routes>
    </Router>
  );
}
