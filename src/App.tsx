import { useAppStore } from './store';
import Login from './pages/Login';
import Main from './pages/Main';

export default function App() {
  const currentUser = useAppStore((state) => state.currentUser);

  if (!currentUser) {
    return <Login />;
  }

  return <Main />;
}
