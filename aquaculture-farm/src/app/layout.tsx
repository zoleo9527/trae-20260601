"use client";

import "./globals.css";
import { useState } from "react";
import { CurrentUserContext, roleUsers } from "@/lib/context";
import type { CurrentUser } from "@/lib/context";
import { usePathname } from "next/navigation";

const navItems = [
  { label: "首页", href: "/", icon: "🏠" },
  { label: "塘口巡检", href: "/inspections", icon: "🔍" },
  { label: "水质预警", href: "/warnings", icon: "⚠️" },
  { label: "投喂记录", href: "/feed-records", icon: "🐟" },
  { label: "药品台账", href: "/medications", icon: "💊" },
];

const roleLabels: Record<string, string> = {
  TECHNICIAN: "养殖技术员",
  FEED_MANAGER: "饲料仓管",
  FARM_DIRECTOR: "场长",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<CurrentUser>(roleUsers.TECHNICIAN);
  const pathname = usePathname();

  return (
    <html lang="zh-CN">
      <body style={{ margin: 0, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        <CurrentUserContext.Provider value={{ user, setUser }}>
          <div style={{ display: "flex", minHeight: "100vh" }}>
            <aside
              style={{
                width: 220,
                background: "#0f172a",
                color: "#e2e8f0",
                display: "flex",
                flexDirection: "column",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  padding: "20px 16px",
                  fontSize: 16,
                  fontWeight: 700,
                  borderBottom: "1px solid #1e293b",
                  letterSpacing: 0.5,
                }}
              >
                🐟 水产养殖场
              </div>
              <div style={{ padding: "12px 16px 8px", fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
                导航
              </div>
              <nav style={{ flex: 1, padding: "0 8px" }}>
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "10px 12px",
                        borderRadius: 6,
                        color: active ? "#fff" : "#94a3b8",
                        textDecoration: "none",
                        fontSize: 14,
                        background: active ? "#1e293b" : "transparent",
                        fontWeight: active ? 600 : 400,
                        marginBottom: 2,
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 16 }}>{item.icon}</span>
                      {item.label}
                    </a>
                  );
                })}
              </nav>
              <div style={{ padding: "16px", borderTop: "1px solid #1e293b" }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>
                  当前角色
                </div>
                <select
                  value={user.role}
                  onChange={(e) => {
                    const role = e.target.value;
                    setUser(roleUsers[role]);
                  }}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 6,
                    background: "#1e293b",
                    color: "#e2e8f0",
                    border: "1px solid #334155",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  <option value="TECHNICIAN">技术员 - {roleUsers.TECHNICIAN.name}</option>
                  <option value="FEED_MANAGER">仓管 - {roleUsers.FEED_MANAGER.name}</option>
                  <option value="FARM_DIRECTOR">场长 - {roleUsers.FARM_DIRECTOR.name}</option>
                </select>
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#334155", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 600 }}>
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>{roleLabels[user.role]}</div>
                  </div>
                </div>
              </div>
            </aside>
            <main
              style={{
                flex: 1,
                background: "#f1f5f9",
                padding: 24,
                overflowY: "auto",
                minWidth: 0,
              }}
            >
              {children}
            </main>
          </div>
        </CurrentUserContext.Provider>
      </body>
    </html>
  );
}
