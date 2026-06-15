import type { Metadata } from "next";
import "@/index.css";

export const metadata: Metadata = {
  title: "数码回收店 · 议价复核与打款申请",
  description: "Digital Recycle Store - Bargain Review & Payment Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
