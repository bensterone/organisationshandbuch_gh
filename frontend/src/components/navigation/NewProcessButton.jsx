import React, { useState } from 'react';
import Button from '../common/Button';
import { createProcess } from '../../services/processes';
import { useNavigationStore } from '../../stores/navigationStore';
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const STARTER_BPMN = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             targetNamespace="https://example.org/bpmn">
  <process id="Process_1" isExecutable="false">
    <startEvent id="StartEvent_1" />
  </process>
</definitions>`;

export default function NewProcessButton({ parentId = null }) {
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleClick = async () => {
    if (busy) return;
    setBusy(true);
    try {
      // 1) create a navigation item of type process
      const title = "New Process";
      const { data: nav } = await api.post("/navigation", {
        parent_id: parentId,
        title,
        type: "process",
        sort_order: 0,
      });

      // 2) create the processes row tied to that navigation item
      const proc = await createProcess({
        navigation_item_id: nav.id,
        bpmn_xml: STARTER_BPMN,
      });

      const processId = proc?.id ?? proc?.data?.id ?? proc?.process?.id;
      if (!processId) throw new Error("Could not get process id");

      // 3) jump to the BPMN editor
      navigate(`/processes/${processId}`);
    } catch (e) {
      console.error(e);
      window.alert(e?.response?.data?.error || "Failed to create process");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700"
      title="Create a new BPMN process"
    >
      {busy ? "Creating…" : "+ New Process"}
    </button>
  );
}
