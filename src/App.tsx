import { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { QueueList } from './components/QueueList';
import { TableStatus } from './components/TableStatus';
import { QueueDetailModal } from './components/QueueDetailModal';
import { TableManagement } from './components/TableManagement';
import { SystemLogs } from './components/SystemLogs';
import { useStore } from './store';
import { queueApi, tableApi } from './api';
import { Queue } from './types';
function App() {
 const [isLoggedIn, setIsLoggedIn] = useState(false);
 const [currentPage, setCurrentPage] = useState('home');
 const [selectedQueueId, setSelectedQueueId] = useState<string | null>(null);
 const { user, queues, tables, logs, setQueues, setTables, setLogs } = useStore();
 useEffect(() => {
 if (isLoggedIn) {
 loadData();
 }
 }, [isLoggedIn]);
 const loadData = async () => {
 try {
 const [queuesData, tablesData, logsData] = await Promise.all([
 queueApi.getQueues(),
 tableApi.getTables(),
 queueApi.getQueues(),
 ]);
 setQueues(queuesData);
 setTables(tablesData);
 }
 catch (err) {
 console.error('加载数据失败:', err);
 }
 };
 const handleLogin = () => {
 setIsLoggedIn(true);
 };
 const handleSelectQueue = (queueId: string) => {
 setSelectedQueueId(queueId);
 };
 const handleCloseDetailModal = () => {
 setSelectedQueueId(null);
 };
 const selectedQueue = queues.find((q) => q.id === selectedQueueId) || null;
 if (!isLoggedIn) {
 return <LoginPage onLogin={handleLogin}/>;
 }
 return (<Layout currentPage={currentPage} onNavigate={setCurrentPage}>
 {currentPage === 'home' && (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 <QueueList queues={queues} onSelectQueue={handleSelectQueue}/>
 <TableStatus tables={tables} onTableClick={() => { }}/>
 </div>)}
 
 {currentPage === 'tables' && (<TableManagement tables={tables}/>)}
 
 {currentPage === 'logs' && (<SystemLogs logs={logs}/>)}

 {selectedQueueId && (<QueueDetailModal queue={selectedQueue} tables={tables} onClose={handleCloseDetailModal}/>)}
 </Layout>);
}
export default App;
