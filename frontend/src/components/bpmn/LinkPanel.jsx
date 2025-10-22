import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import api from '../../services/api';
import { addLink, deleteLink } from '../../services/links';
import Button from '../common/Button';

const LinkPanel = ({ processId, element, links = [], refreshLinks, onClose }) => {
  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!processId) return;
    api
      .get('/navigation')           // baseURL already includes /api
      .then((res) => {
        const docs = res.data.flatMap(flattenDocs);
        setDocuments(docs.filter((d) => d.type === 'document'));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [processId]);

  const flattenDocs = (item) => [
    item,
    ...(item.children ? item.children.flatMap(flattenDocs) : []),
  ];

  const handleAdd = async () => {
    if (!selectedDoc) return;
    setSaving(true);
    try {
      await addLink(processId, {
        bpmn_element_id: element.id,
        linked_navigation_item_id: selectedDoc,
        link_type: 'reference',
        link_description: description,
      });
      setSelectedDoc('');
      setDescription('');
      await refreshLinks();
    } catch (e) {
      window.alert(e?.response?.data?.error || 'Failed to link document');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (linkId) => {
    if (!window.confirm('Delete this link?')) return;
    await deleteLink(processId, linkId);
    await refreshLinks();
  };

  return (
    <div className="fixed right-0 top-0 w-96 h-full bg-white shadow-2xl z-50 border-l flex flex-col">
      <div className="flex items-center justify-between bg-primary-600 text-white p-4">
        <h3 className="font-semibold">
          Links for: {element?.businessObject?.name || element?.id}
        </h3>
        <button onClick={onClose}>
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Existing Links</h4>
          {(!links || links.length === 0) ? (
            <p className="text-sm text-gray-500">No links yet.</p>
          ) : (
            <ul className="space-y-2">
              {links.map((l) => (
                <li
                  key={l.id}
                  className="border rounded p-2 flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{l.document_title}</p>
                    <p className="text-xs text-gray-500">{l.link_description}</p>
                  </div>
                  <Button variant="secondary" onClick={() => handleDelete(l.id)}>
                    ❌
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t pt-4">
          <h4 className="font-semibold mb-2">Add New Link</h4>
          <select
            className="w-full border rounded p-2 mb-2"
            value={selectedDoc}
            onChange={(e) => setSelectedDoc(e.target.value)}
          >
            <option value="">Select document...</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
          <textarea
            className="w-full border rounded p-2 text-sm mb-2"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button onClick={handleAdd} loading={saving}>
            ➕ Add Link
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LinkPanel;
