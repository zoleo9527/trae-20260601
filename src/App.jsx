import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PregnancyTestList from './pages/PregnancyTestList'
import PregnancyTestDetail from './pages/PregnancyTestDetail'
import FarrowingRoomList from './pages/FarrowingRoomList'
import FarrowingRoomDetail from './pages/FarrowingRoomDetail'
import RoleSwitch from './components/RoleSwitch'

function App() {
  return (
    <Layout>
      <RoleSwitch />
      <Routes>
        <Route path="/" element={<PregnancyTestList />} />
        <Route path="/pregnancy-test/:id" element={<PregnancyTestDetail />} />
        <Route path="/farrowing-room" element={<FarrowingRoomList />} />
        <Route path="/farrowing-room/:id" element={<FarrowingRoomDetail />} />
      </Routes>
    </Layout>
  )
}

export default App