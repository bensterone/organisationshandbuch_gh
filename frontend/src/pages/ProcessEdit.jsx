import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import BPMNEditor from '../components/bpmn/BPMNEditor';
import LinkPanel from '../components/bpmn/LinkPanel';
import Button from '../components/common/Button';
import api from '../services/api';
import { getLinks } from '../services/links';
import Modeler from "bpmn-js/lib/Modeler";
import { getProcess, updateProcess } from "../services/processes";

export default function ProcessEdit() {
  const { id } = useParams();
  const canvasRef = useRef(null);
  const modelerRef = useRef(null);

  const [proc, setProc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = await getProcess(id);
      const process = p?.id ? p : p?.data || p;
      setProc(process);

      if (modelerRef.current) {
        modelerRef.current.destroy();
        modelerRef.current = null;
      }
      modelerRef.current = new Modeler({ container: canvasRef.current });

      const xml = process?.bpmn_xml || DEFAULT_BPMN_XML;
      await modelerRef.current.importXML(xml);
      modelerRef.current.get("canvas").zoom("fit-viewport");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    return () => {
      if (modelerRef.current) {
        modelerRef.current.destroy();
        modelerRef.current = null;
      }
    };
  }, [load]);

  const onImportFile = async (file) => {
    if (!file) return;
    const text = await file.text();
    try {
      await modelerRef.current.importXML(text);
      modelerRef.current.get("canvas").zoom("fit-viewport");
    } catch {
      window.alert("Invalid BPMN file");
    }
  };

  const onSave = async () => {
    if (!modelerRef.current || !proc) return;
    setSaving(true);
    try {
      const { xml } = await modelerRef.current.saveXML({ format: true });
      await updateProcess(proc.id, { bpmn_xml: xml });
      window.alert("Saved");
    } catch (e) {
      console.error(e);
      window.alert("Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-sm text-gray-600">Loading…</div>;
  if (!proc) return <div className="p-6 text-sm text-gray-600">Process not found.</div>;

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Process #{proc.id}</h2>
        <div className="flex gap-2">
          <label className="px-3 py-1.5 rounded border cursor-pointer">
            Import .bpmn
            <input
              type="file"
              accept=".bpmn,.xml"
              className="hidden"
              onChange={(e) => onImportFile(e.target.files?.[0])}
            />
          </label>
          <button
            className="px-3 py-1.5 rounded bg-primary-600 text-white hover:bg-primary-700"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <div ref={canvasRef} className="w-full h-[70vh] border rounded bg-white" />
    </div>
  );
}

const DEFAULT_BPMN_XML = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             targetNamespace="https://example.org/bpmn">
  <process id="Process_1" isExecutable="false">
    <startEvent id="StartEvent_1"/>
  </process>
</definitions>`;
