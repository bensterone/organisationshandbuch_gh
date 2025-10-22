import React, { useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, Search, X } from "lucide-react";

export default function Header({ onToggleSidebar }) {
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // ⌘K / Ctrl+K focuses search
  useEffect(() => {
    const onKey = (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      if ((isMac && e.metaKey && e.key.toLowerCase() === "k") ||
          (!isMac && e.ctrlKey && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const goSearch = (q) => {
    if (!q.trim()) return;
    navigate(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="h-14 bg-white border-b px-2 md:px-3 flex items-center gap-2">
      {/* Sidebar toggle */}
      <button
        className="p-2 rounded hover:bg-gray-100"
        onClick={onToggleSidebar}
        aria-label="Toggle navigation"
        title="Toggle navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Brand */}
      <Link to="/" className="font-semibold mr-1 whitespace-nowrap">
        Organisationshandbuch
      </Link>

      {/* Search — shifted left, wider, accessible */}
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            aria-label="Search documents and processes"
            placeholder="Search documents & processes…  (Ctrl/⌘+K)"
            className="w-full h-10 pl-9 pr-20 rounded-md border focus:outline-none focus:ring-2 focus:ring-primary-500/60 focus:border-primary-500 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") goSearch(e.currentTarget.value);
              if (e.key === "Escape") e.currentTarget.blur();
            }}
          />
          {/* Clear & submit cluster on the right inside the input */}
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
              onClick={() => {
                if (inputRef.current) inputRef.current.value = "";
                inputRef.current?.focus();
              }}
              aria-label="Clear search"
              title="Clear"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              className="px-2 py-1 text-xs rounded bg-gray-800 text-white hover:bg-gray-700"
              onClick={() => inputRef.current && goSearch(inputRef.current.value)}
              aria-label="Search"
              title="Search"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Right side (minimal) */}
      <div className="flex-1" />
      <div className="hidden sm:block text-sm text-gray-500">Administrator</div>
      <Link
        to="/login"
        onClick={() => localStorage.clear()}
        className="ml-2 text-sm text-blue-600 hover:underline"
      >
        Logout
      </Link>
    </header>
  );
}
