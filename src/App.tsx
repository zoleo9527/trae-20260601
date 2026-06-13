import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import CourseDetail from './pages/CourseDetail';
import AttendanceList from './pages/AttendanceList';
import Attendance from './pages/Attendance';
import AttendanceDetail from './pages/AttendanceDetail';
import ExceptionCenter from './pages/ExceptionCenter';
import HomeworkSubmissions from './pages/HomeworkSubmissions';
import NotificationList from './pages/NotificationList';
import ExamList from './pages/ExamList';
import ExamDetail from './pages/ExamDetail';
import Layout from './components/Layout';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="courses" element={<CourseList />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="attendance" element={<AttendanceList />} />
          <Route path="attendance/:courseId" element={<Attendance />} />
          <Route path="attendance/:courseId/detail" element={<AttendanceDetail />} />
          <Route path="exceptions" element={<ExceptionCenter />} />
          <Route path="exams" element={<ExamList />} />
          <Route path="exams/:id" element={<ExamDetail />} />
          <Route path="homework/:id/submissions" element={<HomeworkSubmissions />} />
          <Route path="notifications" element={<NotificationList />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
