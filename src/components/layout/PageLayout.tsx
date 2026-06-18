import { Outlet } from "react-router-dom";
import RoleSidebar from "./RoleSidebar";
import TopNav from "./TopNav";

export default function PageLayout() {
  return (
    <div className="flex min-h-screen bg-ink-50">
      <RoleSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
