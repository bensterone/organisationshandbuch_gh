import React from "react";
import clsx from "clsx";

export default function Button({
  children,
  loading = false,
  disabled = false,
  className = "",
  variant = "primary", // "primary" | "secondary" | "ghost"
  ...rest // IMPORTANT: this will NOT include `loading` anymore
}) {
  const base =
    "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary:
      "bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:opacity-60",
    secondary:
      "bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 focus:ring-gray-400 disabled:opacity-60",
    ghost:
      "bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-300 disabled:opacity-60",
  };

  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={clsx(base, variants[variant] || variants.primary, className)}
      type={rest.type || "button"}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="animate-pulse">●●●</span>
          <span>Working…</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
