import { WorkOrderList } from './components/WorkOrderList';
import { Sidebar } from './components/Sidebar';

function App() {
  return (
    <div className="h-screen flex bg-gray-100">
      <WorkOrderList />
      <Sidebar />
    </div>
  );
}

export default App;
