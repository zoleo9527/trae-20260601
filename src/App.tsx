import { useState } from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Layout } from './components/Layout';
import { InventoryList } from './pages/InventoryList';
import { InventoryDetail } from './pages/InventoryDetail';
import { Room } from './types/inventory';

function AppContent() {
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const { rooms } = useInventory();

  const selectedRoom = selectedRoomId
    ? rooms.find((r) => r.id === selectedRoomId) || null
    : null;

  const handleViewDetail = (room: Room) => {
    setSelectedRoomId(room.id);
  };

  const handleBack = () => {
    setSelectedRoomId(null);
  };

  return (
    <Layout>
      {selectedRoom ? (
        <InventoryDetail room={selectedRoom} onBack={handleBack} />
      ) : (
        <InventoryList onViewDetail={handleViewDetail} />
      )}
    </Layout>
  );
}

export default function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}
