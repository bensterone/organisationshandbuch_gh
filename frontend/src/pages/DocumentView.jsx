import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Button from '../components/common/Button';
import Loading from '../components/common/Loading';
import { getByNavigation, createDocument, updateDocument, deleteDocument } from '../services/documents';
import { listFiles } from '../services/files';
import FileUpload from '../components/files/FileUpload';
import FilesList from '../components/files/FilesList';
import StatusPill from '../components/common/StatusPill';
import VersionHistoryPanel from '../components/navigation/VersionHistoryPanel';
import api from '../services/api';
import { useAuthStore } from '../stores/authStore';
import Breadcrumbs from '../components/navigation/Breadcrumbs';
import TagEditor from '../components/tags/TagEditor';
import { isFavorite, toggleFavorite } from '../services/favorites';
import { trackRecent } from '../services/recents';
import { Star } from 'lucide-react';
import RelatedDocuments from '../components/RelatedDocuments';
import { fetchRelated } from '../services/discovery';
import InlineToast from '../components/common/InlineToast';
import QuickEditManager from '../components/editor/QuickEditManager';

const DocumentView = () => {
  const { id } = useParams();
  const navId = Number(id);
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [latest, setLatest] = useState(null);
  const [allVersions, setAllVersions] = useState([]);
  const [json, setJson] = useState({});
  const [text, setText] = useState('');
  const [files, setFiles] = useState([]);
  const [backlinks, setBacklinks] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('draft');
  const [editing, setEditing] = useState(false);
  const [fav, setFav] = useState(false);
  const [related, setRelated] = useState([]);
  const [lastSaved, setLastSaved] = useState(null);
  const [toast, setToast] = useState(null);

  const canEdit = user?.role === 'admin' || user?.role === 'editor';
  const headerTitle = useMemo(() => `Document (Navigation ID: ${navId})`, [navId]);

  const load = async () => {
    setLoading(true);
    try {
      const latestData = await getByNavigation(navId, { all: false });
      setLatest(latestData || null);
      setJson(latestData?.content || {});
      setText(latestData?.content_text || '');
      setStatus(latestData?.status || 'draft');
      if (latestData?.title) {
        const r = await fetchRelated({ q: latestData.title, limit: 8 });
        setRelated(r);
      }
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.error || 'Failed to load document' });
    } finally { setLoading(false); }
  };

  const loadFiles = async () => setFiles(await listFiles(navId).catch(() => []));
  const loadBacklinks = async () => {
    const res = await api.get(`/api/documents/${navId}/backlinks`).catch(() => ({ data: [] }));
    setBacklinks(res.data || []);
  };

  useEffect(() => {
    load(); loadFiles(); loadBacklinks();
    isFavorite(navId).then(setFav).catch(() => setFav(false));
    trackRecent(navId);
  }, [navId]);

  const handleSaveNewVersion = async () => {
    setSaving(true);
    try {
      await createDocument({ navigation_item_id: navId, content: json || {}, content_text: text || '' });
      setToast({ type: 'success', message: 'New version saved successfully.' });
      setLastSaved(new Date());
      await load();
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.error || 'Save failed' });
    } finally { setSaving(false); }
  };

  const handleUpdateExisting = async () => {
    if (!latest) return;
    setSaving(true);
    try {
      await updateDocument(latest.id, { content: json || {}, content_text: text || '' });
      setToast({ type: 'success', message: 'Document updated successfully.' });
      setLastSaved(new Date());
      await load();
      await loadBacklinks();
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.error || 'Update failed' });
    } finally { setSaving(false); }
  };

  const handleDeleteVersion = async (docId) => {
    if (!confirm('Delete this version?')) return;
    try {
      await deleteDocument(docId);
      if (latest?.id === docId) await load();
      setToast({ type: 'success', message: 'Version deleted.' });
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.error || 'Delete failed' });
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      setStatus(newStatus);
      await api.put(`/api/navigation/${navId}/status`, { status: newStatus });
      setToast({ type: 'success', message: `Status changed to ${newStatus}` });
    } catch {
      setToast({ type: 'error', message: 'Failed to update status' });
    }
  };

  const toggleFav = async () => {
    const state = await toggleFavorite(navId);
    setFav(state);
    setToast({ type: state ? 'success' : 'info', message: state ? 'Added to favorites' : 'Removed from favorites' });
  };

  if (loading) return <Loading text="Loading document..." />;

  return (
    <div className="space-y-6">
      <Breadcrumbs navId={navId} />
      {toast && <InlineToast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{headerTitle}</h1>
          <StatusPill status={status} />
          {canEdit && (
            <select className="ml-2 border rounded px-2 py-1 text-sm" value={status} onChange={(e) => handleStatusChange(e.target.value)}>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="approved">Approved</option>
              <option value="deprecated">Deprecated</option>
            </select>
          )}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          <button
            onClick={toggleFav}
            className={`flex items-center gap-1 px-3 py-1.5 rounded border ${fav ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
            title={fav ? 'Unfavorite' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${fav ? 'fill-yellow-400 stroke-yellow-600' : ''}`} />
            <span className="text-sm">{fav ? 'Favorited' : 'Favorite'}</span>
          </button>

          {canEdit && (
            <Button variant="secondary" onClick={() => setEditing(v => !v)}>
              {editing ? 'Cancel Full Edit' : 'Full Edit'}
            </Button>
          )}
          {editing && (
            <>
              <Button onClick={handleSaveNewVersion} loading={saving}>Save as new version</Button>
              <Button variant="secondary" onClick={handleUpdateExisting} disabled={!latest} loading={saving}>
                Update current
              </Button>
            </>
          )}
        </div>
      </div>

      {lastSaved && <p className="text-xs text-gray-500">Last saved {lastSaved.toLocaleTimeString()}</p>}

      <div className="bg-white border rounded-lg p-3"><TagEditor navId={navId} /></div>

      {/* Quick Edit via Manager */}
      {!editing ? (
        <QuickEditManager id={navId} type="document" canEdit={canEdit} />
      ) : (
        <div className="bg-white border rounded-lg p-4">
          <p className="text-gray-500 text-sm">Full editor not yet migrated to QuickEditManager.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <FileUpload navigationItemId={navId} onUploaded={loadFiles} />
        <div className="border rounded-lg p-4 bg-white">
          <h3 className="font-semibold mb-3">Files</h3>
          <FilesList files={files} onDeleted={loadFiles} />
        </div>
      </div>

      {showVersions && (
        <VersionHistoryPanel
          versions={allVersions}
          latest={latest}
          onLoadVersion={(v) => { setLatest(v); setJson(v.content || {}); setText(v.content_text || ''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onDelete={handleDeleteVersion}
        />
      )}
    </div>
  );
};

export default DocumentView;
