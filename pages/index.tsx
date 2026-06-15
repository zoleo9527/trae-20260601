import React, { useState } from 'react';
import { Layout } from '../components/Layout';
import Dashboard from './Dashboard';
import QualityInspection from './QualityInspection';
import Packaging from './Packaging';

export default function Home() {
  const [activeMenu, setActiveMenu] = useState('dashboard');

  const renderContent = () => {
    switch (activeMenu) {
      case 'dashboard':
        return <Dashboard />;
      case 'quality':
        return <QualityInspection />;
      case 'packaging':
        return <Packaging />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <Layout activeMenu={activeMenu} onMenuChange={setActiveMenu}>
      {renderContent()}
    </Layout>
  );
}