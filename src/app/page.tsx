'use client';

import { useState } from 'react';
import Layout from '../components/Layout';

export default function Home() {
  const [currentTab, setCurrentTab] = useState('batches');

  return (
    <Layout 
      currentTab={currentTab} 
      onTabChange={setCurrentTab}
      userName="张三"
      userRole="registrar"
    />
  );
}
