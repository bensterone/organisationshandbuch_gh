import React, { useEffect, useState } from "react";
import Header from "./Header";
import NavigationTree from "../navigation/NavigationTree";

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  // remember sidebar state
  useEffect(() => {
    const saved = localStorage.getItem("nav_collapsed");
    if (saved != null) setCollapsed(saved === "1");
  }, []);
  useEffect(() => {
    localStorage.setItem("nav_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header onToggleSidebar={() => setCollapsed((s) => !s)} />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`border-r bg-white transition-all duration-200 ${
            collapsed ? "w-0 md:w-0" : "w-72"
          } overflow-hidden`}
        >
          {!collapsed && (
            <div className="h-full flex flex-col">
              <NavigationTree />
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
