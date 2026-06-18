import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/pages/Dashboard';
import { FeedbackList } from '@/pages/FeedbackList';
import { FeedbackDetail } from '@/pages/FeedbackDetail';
import { CertificateList } from '@/pages/CertificateList';
import { CertificateDetail } from '@/pages/CertificateDetail';
import { FlowBoard } from '@/pages/FlowBoard';

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/feedback" element={<FeedbackList />} />
                <Route path="/feedback/:id" element={<FeedbackDetail />} />
                <Route path="/certificate" element={<CertificateList />} />
                <Route path="/certificate/:id" element={<CertificateDetail />} />
                <Route path="/flow" element={<FlowBoard />} />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
