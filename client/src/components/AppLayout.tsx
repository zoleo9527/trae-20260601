import { Outlet, Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import './AppLayout.css';

dayjs.locale('zh-cn');

const NAV_ITEMS = [
  { path: '/', label: '运行监控', icon: '◉' },
  { path: '/gate', label: '道口工作站', icon: '🗹' },
  { path: '/yard', label: '堆场工作站', icon: '⊞' },
  { path: '/customer', label: '客服工作站', icon: '≋' },
];

const PAGE_TITLES: Record<string, string> = {
  '/': '运行监控中心',
  '/gate': '道口工作站',
  '/yard': '堆场工作站',
  '/customer': '客服工作站',
};

export default function AppLayout() {
  const location = useLocation();
  const [time, setTime] = useState(dayjs().format('YYYY年MM月DD日 HH:mm:ss'));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(dayjs().format('YYYY年MM月DD日 HH:mm:ss'));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const pageTitle = PAGE_TITLES[location.pathname] || '港口堆场管理系统';

  return (
    <div className="app-layout">
      <aside className="app-layout__sidebar">
        <div className="app-layout__logo">
          <div className="app-layout__logo-title">港口堆场管理</div>
          <div className="app-layout__logo-subtitle">PORT YARD SYSTEM</div>
        </div>
        <nav className="app-layout__nav">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`app-layout__nav-link ${
                location.pathname === item.path ? 'app-layout__nav-link--active' : ''
              }`}
            >
              <span className="app-layout__nav-icon">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="app-layout__main">
        <header className="app-layout__header">
          <span className="app-layout__header-title">{pageTitle}</span>
          <span className="app-layout__header-time">{time}</span>
        </header>
        <main className="app-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
