import React, { useEffect, useState } from "react";
import api from "../services/api";

export default function Dashboard() {
  const [stats, setStats] = useState({ documents: 0, processes: 0, files: 0 });

  useEffect(() => {
    api.get("/stats").then((res) => setStats(res.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card label="Documents" value={stats.documents} />
        <Card label="Processes" value={stats.processes} />
        <Card label="Files" value={stats.files} />
      </div>

      {/* You can keep any other center content here. The navigation lives in the sidebar now. */}
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="rounded-lg border bg-white p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
