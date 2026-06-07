import { Routes, Route } from 'react-router-dom';
import MemberRefundReview from './pages/MemberRefundReview';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MemberRefundReview />} />
    </Routes>
  );
}

export default App;
