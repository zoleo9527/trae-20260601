import { useState } from 'react';
import type { UserRole } from './types';
import PawnStorageWorkbench from './pages/PawnStorageWorkbench';

function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('warehouse');

  return (
    <PawnStorageWorkbench currentRole={currentRole} onRoleChange={setCurrentRole} />
  );
}

export default App;
