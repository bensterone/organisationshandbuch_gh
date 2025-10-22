import React, { useState } from "react";
import api from "../../services/api";
import { createDocument } from "../../services/documents";
import { createProcess } from "../../services/processes";

const STARTER_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
             targetNamespace="https://example.org/bpmn">
  <process id="Process_1" isExecutable="false">
    <startEvent id="StartEvent_1"/>
  </process>
</definitions>`;

// Minimal valid Editor.js document (stringified before sending)
const EMPTY_EDITORJS_DOC = {
  time: Date.now(),
  blocks: [{ type: "paragraph", data: { text: "" } }],
  version: "2.29.0",
};

export default function NewItemModal({ onClose, onCreated, parentId = null }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("folder"); // 'folder' | 'document' | 'process'
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    setError("");
    setSaving(true);

    try {
      // 1) Create navigation item
      const navPayload = {
        parent_id: parentId,
        title: title.trim(),
        type, // 'folder' | 'document' | 'process'
        sort_order: 0,
      };

      const { data: navItem } = await api.post("/navigation", navPayload);

      // 2) If document → create a documents row right away
      if (type === "document") {
        await createDocument({
          navigation_item_id: navItem.id,
          title: title.trim(),
          // Store a valid Editor.js JSON string
          content: JSON.stringify(EMPTY_EDITORJS_DOC),
        });
      }

      // 3) If process → create processes row with starter BPMN
      if (type === "process") {
        await createProcess({
          navigation_item_id: navItem.id,
          bpmn_xml: STARTER_BPMN,
        });
      }

      // 4) Notify parent, close modal
      onCreated?.(navItem);
      onClose?.();
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to create item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="p-4 border-b">
          <h3 className="font-semibold">Create New</h3>
        </div>

        <div className="p-4 space-y-3">
          {error && (
            <div className="text-sm text-red-600" role="alert">
              {error}
            </div>
          )}

          <label className="block text-sm font-medium">Title</label>
          <input
            className="w-full border rounded px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
          />

          <label className="block text-sm font-medium mt-2">Type</label>
          <select
            className="w-full border rounded px-3 py-2"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="folder">Folder</option>
            <option value="document">Document</option>
            <option value="process">Process</option>
          </select>
        </div>

        <div className="p-4 border-t flex justify-end gap-2">
          <button className="px-4 py-2 rounded border" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded bg-primary-600 text-white hover:bg-primary-700"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
