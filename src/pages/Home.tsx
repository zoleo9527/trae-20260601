import { ComplaintDetail } from '../components/complaint/ComplaintDetail';
import { Header } from '../components/layout/Header';
import { Sidebar } from '../components/layout/Sidebar';
import { MapView } from '../components/map/MapView';

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-slate-100">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MapView />
      </div>
      <ComplaintDetail />
    </div>
  );
}
