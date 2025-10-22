import React, { useEffect, useRef, useState, useCallback } from "react";
import clsx from "clsx";

/**
 * A lightweight resizable sidebar with:
 * - drag handle (gutter)
 * - persisted width (localStorage)
 * - collapse/expand
 * - double-click gutter to reset
 *
 * Props:
 * - storageKey: string (localStorage key to persist width/collapsed)
 * - min: number (px)
 * - max: number (px)
 * - initial: number (px)
 * - className?: string
 * - sidebar: ReactNode (left content)
 * - children: ReactNode (right content)
 */
export default function ResizableSidebar({
  storageKey = "sidebar.documents",
  min = 220,
  max = 520,
  initial = 300,
  className = "",
  sidebar,
  children,
}) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(initial);
  const [collapsed, setCollapsed] = useState(false);
  const draggingRef = useRef(false);

  // Load persisted state
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const { width: w, collapsed: c } = JSON.parse(raw);
      if (typeof w === "number") setWidth(Math.min(max, Math.max(min, w)));
      if (typeof c === "boolean") setCollapsed(c);
    } catch {}
  }, [storageKey, min, max]);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ width, collapsed }));
    } catch {}
  }, [storageKey, width, collapsed]);

  const startDrag = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = {
      startX: e.clientX || (e.touches && e.touches[0]?.clientX) || 0,
      startW: width,
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", endDrag);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", endDrag);
  }, [width]);

  const onMove = (e) => {
    if (!draggingRef.current) return;
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX) ?? 0;
    const dx = clientX - draggingRef.current.startX;
    const next = Math.min(max, Math.max(min, draggingRef.current.startW + dx));
    setCollapsed(false);
    setWidth(next);
  };

  const endDrag = () => {
    draggingRef.current = false;
    window.removeEventListener("mousemove", onMove);
    window.removeEventListener("mouseup", endDrag);
    window.removeEventListener("touchmove", onMove);
    window.removeEventListener("touchend", endDrag);
  };

  const toggleCollapse = () => setCollapsed((c) => !c);

  const resetWidth = () => {
    setWidth(initial);
    setCollapsed(false);
  };

  return (
    <div ref={containerRef} className={clsx("w-full h-full flex", className)}>
      {/* LEFT: sidebar */}
      <aside
        className={clsx(
          "relative border-r bg-white transition-[width] duration-150 ease-out",
          collapsed ? "w-0" : ""
        )}
        style={{ width: collapsed ? 0 : width }}
      >
        {/* collapse button */}
        <button
          onClick={toggleCollapse}
          title={collapsed ? "Expand" : "Collapse"}
          className="absolute -right-3 top-3 z-10 bg-white border rounded-full w-6 h-6 text-xs shadow hover:bg-gray-50"
        >
          {collapsed ? "»" : "«"}
        </button>

        {/* sidebar content (hide when collapsed for a11y) */}
        <div className={clsx("h-full", collapsed && "pointer-events-none opacity-0")}>
          {sidebar}
        </div>
      </aside>

      {/* GUTTER / DRAG HANDLE */}
      <div
        role="separator"
        aria-orientation="vertical"
        title="Drag to resize (double-click to reset)"
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        onDoubleClick={resetWidth}
        className="w-1.5 cursor-col-resize bg-gray-100 hover:bg-gray-200 active:bg-gray-300"
      />

      {/* RIGHT: main content */}
      <main className="flex-1 min-w-0">{children}</main>
    </div>
  );
}
