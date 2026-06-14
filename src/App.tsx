import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import FeedbackList from "@/pages/FeedbackList";
import FeedbackDetail from "@/pages/FeedbackDetail";
import RenewalList from "@/pages/RenewalList";
import RenewalDetail from "@/pages/RenewalDetail";
import StudentList from "@/pages/StudentList";
import StudentDetail from "@/pages/StudentDetail";
import ExceptionList from "@/pages/ExceptionList";
import ExceptionDetail from "@/pages/ExceptionDetail";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/feedback" element={<FeedbackList />} />
          <Route path="/feedback/:id" element={<FeedbackDetail />} />
          <Route path="/renewal" element={<RenewalList />} />
          <Route path="/renewal/:id" element={<RenewalDetail />} />
          <Route path="/students" element={<StudentList />} />
          <Route path="/student/:id" element={<StudentDetail />} />
          <Route path="/exceptions" element={<ExceptionList />} />
          <Route path="/exception/:id" element={<ExceptionDetail />} />
        </Route>
      </Routes>
    </Router>
  );
}
