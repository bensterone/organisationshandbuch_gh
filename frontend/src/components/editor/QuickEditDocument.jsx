import React, { useEffect, useState } from 'react';
import { Check, Edit3, X } from 'lucide-react';
import InlineToast from '../common/InlineToast';
import { updateDocument, getByNavigation } from '../../services/documents';

const QuickEditParagraph = ({ text, canEdit, onSave }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(text);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (value.trim() === text.trim()) { setEditing(false); return; }
    setSaving(true);
    await onSave(value);
    setSaving(false);
    setEditing(false);
  };

  if (!canEdit) return <p className="mb-3 leading-relaxed">{text}</p>;

  return (
    <div className="relative group mb-3">
      {!editing ? (
        <>
          <p className="leading-relaxed">{value}</p>
          <button
            onClick={() => setEditing(true)}
            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-white border rounded-full p-1 shadow-sm hover:bg-gray-50"
            title="Quick edit paragraph"
          >
            <Edit3 className="w-4 h-4 text-gray-600" />
          </button>
        </>
      ) : (
        <div className="border rounded-lg bg-gray-50 p-3 space-y-2">
          <textarea
            className="w-full border rounded p-2 text-sm font-normal"
            rows={4}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <button onClick={() => setEditing(false)} className="flex items-center gap-1 px-3 py-1 text-sm border rounded hover:bg-gray-100">
              <X className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1 px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const QuickEditDocument = ({ docId, canEdit }) => {
  const [loading, setLoading] = useState(true);
  const [document, setDocument] = useState(null);
  const [paragraphs, setParagraphs] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getByNavigation(docId, { all: false });
        setDocument(data);
        const body = data?.content_text || '';
        setParagraphs(body.split(/\n\s*\n/).filter(p => p.trim().length > 0));
      } catch (e) {
        setToast({ type: 'error', message: e.response?.data?.error || 'Failed to load content' });
      } finally { setLoading(false); }
    };
    load();
  }, [docId]);

  const handleParagraphSave = async (index, newText) => {
    const updated = [...paragraphs];
    updated[index] = newText;
    const newBody = updated.join('\n\n');
    try {
      await updateDocument(document.id, { content: document.content || {}, content_text: newBody });
      setParagraphs(updated);
      setToast({ type: 'success', message: 'Paragraph saved successfully.' });
    } catch (e) {
      setToast({ type: 'error', message: e.response?.data?.error || 'Save failed' });
    }
  };

  if (loading) return <p className="text-gray-500">Loading document...</p>;

  return (
    <div className="bg-white border rounded-lg p-4 space-y-4">
      {toast && <InlineToast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      {paragraphs.length === 0 ? (
        <p className="text-gray-500 italic">No content yet.</p>
      ) : (
        paragraphs.map((p, i) => (
          <QuickEditParagraph
            key={i}
            text={p}
            canEdit={canEdit}
            onSave={(newText) => handleParagraphSave(i, newText)}
          />
        ))
      )}
    </div>
  );
};

export default QuickEditDocument;
