import React, { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import { updateDocument } from "../services/documents";
import EditorJSWrapper from "../components/editor/EditorJSWrapper";

export default function DocumentView() {
  const { id } = useParams(); // navigation item id
  const navId = Number(id);

  const [doc, setDoc] = useState(null);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [saving, setSaving] = useState(false);

  // Keep the most recent editor data (unsaved draft)
  const draftRef = useRef(null);

  const parseContent = (raw) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  };

  const load = useCallback(async () => {
    const res = await api.get("/documents", {
      params: { navigation_item_id: navId },
    });
    const d = (res.data && res.data[0]) || null;
    setDoc(d);
    setTitle(d?.title || "");
    // reset draft when switching documents
    draftRef.current = parseContent(d?.content) || { blocks: [] };
  }, [navId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!doc) {
    return (
      <div className="p-6">
        <h2 className="font-semibold text-lg mb-2">Document</h2>
        <p className="text-sm text-gray-600">No document yet for this item.</p>
      </div>
    );
  }

  const initialData =
    parseContent(doc.content) ||
    { blocks: [{ type: "paragraph", data: { text: doc.content || "" } }] };

  const handleSave = async () => {
    if (!doc) return;
    setSaving(true);
    try {
      const contentToSave =
        draftRef.current && draftRef.current.blocks
          ? draftRef.current
          : initialData;

      await updateDocument(doc.id, {
        title,
        content: JSON.stringify(contentToSave),
      });

      await load();
      setEditing(false);
    } catch (e) {
      console.error(e);
      alert("Failed to save document");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        {editing ? (
          <input
            className="text-lg font-semibold border rounded px-2 py-1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        ) : (
          <h2 className="font-semibold text-lg">{doc.title}</h2>
        )}

        <div className="flex gap-2">
          {!editing ? (
            <button
              className="px-3 py-1.5 rounded bg-primary-600 text-white hover:bg-primary-700"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          ) : (
            <>
              <button
                className="px-3 py-1.5 rounded border"
                onClick={() => {
                  setTitle(doc.title || "");
                  draftRef.current = initialData;
                  setEditing(false);
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 rounded bg-primary-600 text-white hover:bg-primary-700"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded border p-3">
        <EditorJSWrapper
          key={doc.id}                 // remount editor when switching docs
          value={initialData}          // initial data
          readOnly={!editing}          // toggle edit/view
          onChange={(data) => {        // capture latest draft
            draftRef.current = data;
          }}
        />
      </div>
    </div>
  );
}
