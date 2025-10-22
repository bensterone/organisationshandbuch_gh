import React, { useEffect, useState } from 'react';
import { X, History } from 'lucide-react';
import api from '../../services/api';
import Button from '../common/Button';

const VersionHistoryPanel = ({ itemId, type, onClose }) => {
  const [versions, setVersions] = useState([]);
  const [label, setLabel] = useState('');
  const [summary, setSummary] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await api.get(`navigation/${itemId}/versions`);
    setVersions(res.data);
  };

  useEffect(() => { load(); }, [itemId]);

  const createVersion = async () => {
    if (!label.trim()) return;
    setBusy(true);
    try {
      let snapshot = {};
      if (type === 'process') {
        const pd = await api.get(`processes/${itemId}`); // we use navigation_item_id == process nav id
        snapshot = { bpmn_xml: pd.data.bpmn_xml };
      } else if (type === 'document') {
        const cb = await api.get(`documents/${itemId}`); // <-- if you don’t have this yet, we’ll add soon
        snapshot = { content: cb.data.content, content_text: cb.data.content_text };
      }
      await api.post(`navigation/${itemId}/versions`, {
        version_label: label.trim(),
        summary: summary.trim(),
        snapshot
      });
      setLabel(''); setSummary('');
      await load();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to create version');
    } finally { setBusy(false); }
  };

  const restore = async (vId) => {
    if (!window.confirm("Revert to this version?")) return;
    await api.post(`navigation/${itemId}/versions/${vId}/restore`);
    alert('Restored.');
  };

  return (
    <div className="fixed right-0 top-0 h-full w-[420px] bg-white border-l z-50 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold">Version History</h3>
        </div>
        <button onClick={onClose}><X className="w-5 h-5" /></button>
      </div>

      <div className="p-4 space-y-4 overflow-auto">
        <div className="border rounded-lg p-3">
          <p className="text-sm font-medium mb-2">Create new version</p>
          <input className="w-full border rounded p-2 mb-2" placeholder="Version label (e.g., v1.2)"
                 value={label} onChange={(e)=>setLabel(e.target.value)} />
          <input className="w-full border rounded p-2 mb-2" placeholder="Summary (optional)"
                 value={summary} onChange={(e)=>setSummary(e.target.value)} />
          <Button onClick={createVersion} loading={busy}>Create Version</Button>
        </div>

        <div>
          <p className="text-sm font-medium mb-2">Existing versions</p>
          {versions.length === 0 ? (
            <p className="text-sm text-gray-500">No versions yet.</p>
          ) : (
            <ul className="space-y-2">
              {versions.map(v => (
                <li key={v.id} className="border rounded p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{v.version_label}</p>
                      <p className="text-xs text-gray-500">{v.summary}</p>
                      <p className="text-xs text-gray-400 mt-1">by {v.created_by_name || '—'} on {new Date(v.created_at).toLocaleString()}</p>
                    </div>
                    <Button variant="secondary" onClick={() => restore(v.id)}>Restore</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryPanel;
