import { WorkbenchProvider } from './context/WorkbenchContext';
import App from './App';
import { createRoot } from 'react-dom/client';

createRoot(document.getElementById('root')!).render(
  <WorkbenchProvider>
    <App />
  </WorkbenchProvider>
);
