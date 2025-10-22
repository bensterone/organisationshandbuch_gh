import React, { useEffect, useRef } from "react";

/**
 * Props:
 * - value: Editor.js data object  { time?, blocks: [], version? }
 * - readOnly: boolean
 * - onChange: async (data) => void   // called after debounced save
 * - autofocus: boolean
 */
export default function EditorJSWrapper({
  value,
  readOnly = false,
  onChange,
  autofocus = false,
}) {
  const holderRef = useRef(null);
  const editorRef = useRef(null);
  const changeTimer = useRef(null);

  // Create editor once
  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (editorRef.current || !holderRef.current) return;

      // Lazy import to keep bundle lean
      const EditorJS = (await import("@editorjs/editorjs")).default;

      // Example tools — add/remove as you like
      const Header = (await import("@editorjs/header")).default;
      const List = (await import("@editorjs/list")).default;
      const Checklist = (await import("@editorjs/checklist")).default;
      const Paragraph = (await import("@editorjs/paragraph")).default;

      if (cancelled) return;

      const instance = new EditorJS({
        holder: holderRef.current,
        autofocus,
        readOnly,
        data: value || { blocks: [] },
        tools: {
          header: Header,
          list: List,
          checklist: Checklist,
          paragraph: {
            class: Paragraph,
            inlineToolbar: true,
          },
        },
        onChange: () => {
          if (!onChange || readOnly) return;
          // debounce a bit to avoid storms
          clearTimeout(changeTimer.current);
          changeTimer.current = setTimeout(async () => {
            try {
              const data = await instance.save();
              onChange(data);
            } catch {
              /* no-op */
            }
          }, 300);
        },
      });

      // Wait until ready, then store the instance
      instance.isReady
        .then(() => {
          editorRef.current = instance;
        })
        .catch((e) => {
          console.error("EditorJS init failed:", e);
        });
    }

    init();

    // Cleanup on unmount
    return () => {
      cancelled = true;
      clearTimeout(changeTimer.current);
      const ed = editorRef.current;
      editorRef.current = null;
      // Guard: only call if function exists
      if (ed && typeof ed.destroy === "function") {
        try {
          ed.destroy();
        } catch {
          /* ignore */
        }
      }
    };
  }, [autofocus, readOnly]); // create once; readOnly is applied again below

  // Re-render data when external `value` changes (e.g., route change)
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || !value) return;
    ed.isReady?.then(() => {
      // render replaces content; safe on navigation
      ed.render(value);
    });
  }, [value]);

  // Toggle readOnly dynamically
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.isReady?.then(() => {
      try {
        // Recent EditorJS exposes readOnly API via API.readOnly.toggle
        if (ed.readOnly && typeof ed.readOnly.toggle === "function") {
          const shouldEnable = !readOnly;
          const isEnabled = !ed.readOnly.isEnabled;
          if (shouldEnable !== isEnabled) {
            ed.readOnly.toggle(!readOnly);
          }
        }
      } catch {
        /* ignore if not supported */
      }
    });
  }, [readOnly]);

  return (
    <div className="prose max-w-none">
      <div ref={holderRef} />
    </div>
  );
}
