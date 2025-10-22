import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";

// defensively resolve a navigation item id from varying API shapes
function getNavId(item) {
  // prefer explicit fields if present
  if (item?.navigation_item_id != null) return item.navigation_item_id;
  if (item?.nav_id != null) return item.nav_id;

  // in some old responses, a "navigation" row is returned directly with id
  // (be careful: documents also have their own "id", so only use as last resort)
  if (item?.type === "folder" || item?.type === "document" || item?.type === "process") {
    if (item?.id != null) return item.id;
  }

  // sometimes nested objects exist
  if (item?.navigation?.id != null) return item.navigation.id;

  return undefined;
}

function SectionTitle({ children }) {
  return <h3 className="text-lg font-semibold mt-6 mb-2">{children}</h3>;
}

function Row({ icon, title, sub, onClick, disabled }) {
  const base =
    "flex items-center justify-between px-3 py-2 rounded border hover:bg-gray-50 transition";
  const cls = disabled ? `${base} opacity-60 cursor-not-allowed` : `${base} cursor-pointer`;
  return (
    <div className={cls} onClick={!disabled ? onClick : undefined}>
      <div className="flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <div>
          <div className="font-medium">{title || "(Untitled)"}</div>
          {sub ? <div className="text-xs text-gray-500">{sub}</div> : null}
        </div>
      </div>
      {!disabled ? <span className="text-gray-400">›</span> : null}
    </div>
  );
}

export default function SearchResults() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get("q") || "");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState({ navigation: [], documents: [], processes: [] });
  const [error, setError] = useState("");

  const doSearch = async (term) => {
    if (!term?.trim()) {
      setRes({ navigation: [], documents: [], processes: [] });
      setError("");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/search", { params: { q: term } });
      // normalize buckets
      setRes({
        navigation: data.navigation || data.nav || [],
        documents: data.documents || data.docs || [],
        processes: data.processes || data.procs || [],
      });
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Search failed");
      setRes({ navigation: [], documents: [], processes: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // run on initial load if /search?q=...
    if (q) doSearch(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (e) => {
    e.preventDefault();
    setParams(q ? { q } : {});
    doSearch(q);
  };

  const navHits = useMemo(() => res.navigation || [], [res]);
  const docHits = useMemo(() => res.documents || [], [res]);
  const procHits = useMemo(() => res.processes || [], [res]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Search</h1>

      <form onSubmit={onSubmit} className="flex items-center gap-2 mb-4">
        <input
          className="flex-1 border rounded px-3 py-2"
          placeholder="Search documents & processes…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button
            type="button"
            className="px-3 py-2 rounded border"
            onClick={() => {
              setQ("");
              setParams({});
              setRes({ navigation: [], documents: [], processes: [] });
              setError("");
            }}
          >
            Clear
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 rounded bg-gray-800 text-white hover:bg-gray-700"
          disabled={loading}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </form>

      {!!error && (
        <div className="mb-4 px-3 py-2 rounded border border-red-300 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Navigation hits (optional—can hide if you don’t want this group) */}
      {navHits.length > 0 && (
        <>
          <SectionTitle>Navigation</SectionTitle>
          <div className="space-y-2">
            {navHits.map((n) => {
              const navId = getNavId(n);
              const disabled = !navId;
              const title = n.title || n.name || "(Untitled)";
              const icon = n.type === "folder" ? "📁" : n.type === "process" ? "🔀" : "📄";
              return (
                <Row
                  key={`${n.type || "nav"}-${n.id || navId || Math.random()}`}
                  icon={icon}
                  title={title}
                  sub={n.type}
                  disabled={disabled}
                  onClick={() => navigate(`/documents/${navId}`)}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Documents */}
      {docHits.length > 0 && (
        <>
          <SectionTitle>Documents</SectionTitle>
          <div className="space-y-2">
            {docHits.map((d) => {
              const navId = getNavId(d);
              const disabled = !navId;
              const title = d.title || "(Untitled)";
              const when =
                d.updated_at || d.updatedAt || d.created_at || d.createdAt || null;
              return (
                <Row
                  key={`doc-${d.id || navId || Math.random()}`}
                  icon="📄"
                  title={title}
                  sub={when ? new Date(when).toLocaleString() : undefined}
                  disabled={disabled}
                  onClick={() => navigate(`/documents/${navId}`)}
                />
              );
            })}
          </div>
        </>
      )}

      {/* Processes */}
      {procHits.length > 0 && (
        <>
          <SectionTitle>Processes</SectionTitle>
          <div className="space-y-2">
            {procHits.map((p) => {
              // Prefer explicit process id for /processes/:id route
              const processId = p.id || p.process_id || p.processId;
              const disabled = !processId;
              const title = p.title || p.name || "New Process";
              return (
                <Row
                  key={`proc-${processId || Math.random()}`}
                  icon="🔀"
                  title={title}
                  disabled={disabled}
                  onClick={() => navigate(`/processes/${processId}`)}
                />
              );
            })}
          </div>
        </>
      )}

      {!loading && !error && navHits.length + docHits.length + procHits.length === 0 && q && (
        <div className="text-sm text-gray-500 mt-6">No results.</div>
      )}
    </div>
  );
}
