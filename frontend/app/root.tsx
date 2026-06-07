import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { RoleProvider } from "~/context/RoleContext";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f7fa; color: #333; }
          .app-container { min-height: 100vh; display: flex; flex-direction: column; }
          .header { background: #2c5530; color: white; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; }
          .header h1 { font-size: 20px; font-weight: 600; }
          .role-switcher { display: flex; gap: 8px; }
          .role-btn { padding: 6px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; background: rgba(255,255,255,0.2); color: white; }
          .role-btn.active { background: #fff; color: #2c5530; font-weight: 600; }
          .main { flex: 1; padding: 24px; }
          .card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 16px; }
          .card-title { font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #1a3a1e; display: flex; align-items: center; justify-content: space-between; }
          .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: 500; }
          .btn-primary { background: #2c5530; color: white; }
          .btn-primary:hover { background: #1a3a1e; }
          .btn-danger { background: #c0392b; color: white; }
          .btn-warning { background: #f39c12; color: white; }
          .btn-default { background: #ecf0f1; color: #333; }
          .btn:disabled { opacity: 0.5; cursor: not-allowed; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
          th { background: #f8f9fa; font-weight: 600; font-size: 13px; color: #666; }
          tr:hover { background: #f8f9fa; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; }
          .status-DRAFT { background: #e3f2fd; color: #1565c0; }
          .status-SUBMITTED { background: #fff3e0; color: #e65100; }
          .status-REJECTED { background: #ffebee; color: #c62828; }
          .status-MEDICINE_ALLOCATED { background: #f3e5f5; color: #6a1b9a; }
          .status-APPROVED { background: #e8f5e9; color: #2e7d32; }
          .status-MEDICATED { background: #e0f7fa; color: #00695c; }
          .status-CLOSED { background: #eceff1; color: #546e7a; }
          .severity-MILD { background: #e8f5e9; color: #2e7d32; }
          .severity-MODERATE { background: #fff3e0; color: #e65100; }
          .severity-SEVERE { background: #ffebee; color: #c62828; }
          .form-group { margin-bottom: 16px; }
          .form-group label { display: block; margin-bottom: 6px; font-weight: 500; font-size: 14px; }
          .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; }
          .form-group textarea { resize: vertical; min-height: 80px; }
          .timeline { position: relative; padding-left: 24px; }
          .timeline::before { content: ''; position: absolute; left: 8px; top: 0; bottom: 0; width: 2px; background: #e0e0e0; }
          .timeline-item { position: relative; margin-bottom: 16px; }
          .timeline-item::before { content: ''; position: absolute; left: -20px; top: 4px; width: 12px; height: 12px; border-radius: 50%; background: #2c5530; border: 2px solid white; box-shadow: 0 0 0 2px #2c5530; }
          .timeline-item.reject::before { background: #c0392b; box-shadow: 0 0 0 2px #c0392b; }
          .timeline-content { background: #f8f9fa; padding: 12px; border-radius: 4px; }
          .timeline-meta { font-size: 12px; color: #999; margin-top: 4px; }
          .reject-box { background: #ffebee; border-left: 4px solid #c0392b; padding: 12px; margin-bottom: 16px; border-radius: 4px; }
          .reject-box h4 { color: #c0392b; margin-bottom: 8px; font-size: 14px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
          @media (max-width: 768px) { .grid { grid-template-columns: 1fr; } }
          .stat-card { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .stat-card h3 { font-size: 14px; color: #666; margin-bottom: 8px; }
          .stat-card .number { font-size: 28px; font-weight: 600; color: #2c5530; }
          .tabs { display: flex; border-bottom: 2px solid #e0e0e0; margin-bottom: 16px; }
          .tab { padding: 12px 24px; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -2px; font-weight: 500; }
          .tab.active { border-bottom-color: #2c5530; color: #2c5530; }
          .link-btn { background: none; border: none; color: #2c5530; cursor: pointer; text-decoration: underline; font-size: 14px; }
          .medicine-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr auto; gap: 12px; margin-bottom: 8px; align-items: end; }
        `}</style>
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <RoleProvider>
      <Outlet />
    </RoleProvider>
  );
}
