import React, { useEffect, useState } from 'react';
import api from '../services/api';
import Button from '../components/common/Button';

const CONSENT_KEYS = [
  { key: 'usage_analytics', label: 'Allow anonymous usage analytics (on-prem only)' },
  { key: 'error_reports', label: 'Allow sending anonymized error reports to admins' },
];

const PrivacySettings = () => {
  const [consents, setConsents] = useState({});
  const [loading, setLoading] = useState(true);
  const [exportData, setExportData] = useState(null);

  useEffect(() => {
    api.get('/api/privacy/me/consents').then(res => setConsents(res.data || {})).finally(() => setLoading(false));
  }, []);

  const toggle = async (key) => {
    const next = { ...consents, [key]: { granted: !(consents[key]?.granted) } };
    setConsents(next);
    await api.put('/api/privacy/me/consents', { [key]: next[key].granted });
  };

  const requestExport = async () => {
    const res = await api.get('/api/privacy/me/export');
    setExportData(res.data);
  };

  if (loading) return <p>Loading…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Privacy Settings</h1>

      <div className="bg-white border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Consents</h2>
        <ul className="space-y-2">
          {CONSENT_KEYS.map(c => (
            <li key={c.key} className="flex items-center justify-between">
              <span>{c.label}</span>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!consents[c.key]?.granted}
                  onChange={() => toggle(c.key)}
                />
                {consents[c.key]?.granted ? 'Allowed' : 'Blocked'}
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border rounded-lg p-4 mt-6">
        <h2 className="font-semibold mb-2">Data Export</h2>
        <Button onClick={requestExport}>Request my data (JSON)</Button>
        {exportData && (
          <pre className="mt-3 p-3 bg-gray-50 border rounded text-xs overflow-auto">
            {JSON.stringify(exportData, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
};

export default PrivacySettings;
