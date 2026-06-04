import Layout from "@/components/Layout";
import BedsPage from "@/pages/BedsPage";
import NursingLevelsPage from "@/pages/NursingLevelsPage";
import Workbench from "@/pages/Workbench";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Workbench />} />
          <Route path="/beds" element={<BedsPage />} />
          <Route path="/nursing-levels" element={<NursingLevelsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}
