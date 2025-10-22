import React from "react";

/**
 * Minimal placeholder. Replace with your real discovery UI anytime.
 */
export default function SmartDiscoveryPanel({ className = "" }) {
  return (
    <aside className={`p-4 rounded-lg border border-gray-200 ${className}`}>
      <h3 className="text-lg font-semibold mb-2">Smart Discovery</h3>
      <p className="text-sm text-gray-600">
        This is a placeholder panel. Hook it up to discovery/search services when ready.
      </p>
    </aside>
  );
}
