import React, { useEffect, useRef, useState } from 'react';
import EditorJS from '@editorjs/editorjs';
import Header from '@editorjs/header';
import List from '@editorjs/list';
import Checklist from '@editorjs/checklist';
import Quote from '@editorjs/quote';
import Table from '@editorjs/table';
import Code from '@editorjs/code';
import LinkTool from '@editorjs/link';
import AttachesTool from '@editorjs/attaches';
import Button from '../common/Button';
import WikiLinkPopover from './WikiLinkPopover';
import api from '../../services/api';

/**
 * Props:
 *  - docId
 *  - initialContent
 *  - onSaved()
 */
const DocumentEditor = ({ docId, initialContent, onSaved }) => {
  const editorRef = useRef(null);
  const editorHolder = useRef();
  const [saving, setSaving] = useState(false);
  const [showPopover, setShowPopover] = useState(false);
  const [popoverPos, setPopoverPos] = useState({ top: 0, left: 0 });
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState('');

  // --- Initialize Editor.js
  useEffect(() => {
    const editor = new EditorJS({
      holder: editorHolder.current,
      autofocus: true,
      data: initialContent || { blocks: [] },
      tools: {
        header: Header,
        list: List,
        checklist: Checklist,
        quote: Quote,
        table: Table,
        code: Code,
        linkTool: LinkTool,
        attaches: {
          class: AttachesTool,
          config: {
            endpoint: '/api/files/upload',
          },
        },
      },
      onReady: () => {
        editorRef.current = editor;
      },
    });

    return () => {
      editor.isReady
        .then(() => editor.destroy())
        .catch(() => {});
    };
  }, [initialContent]);

  // --- Detect [[ typing
  useEffect(() => {
    const handler = async (e) => {
      if (!editorHolder.current?.contains(e.target)) return;
      if (e.key === '[') {
        const sel = window.getSelection();
        const textBefore = sel?.anchorNode?.textContent?.slice(0, sel.anchorOffset) || '';
        if (textBefore.endsWith('[')) {
          // user just typed [[
          const rect = sel.getRangeAt(0).getBoundingClientRect();
          setPopoverPos({ top: rect.top + window.scrollY, left: rect.left + window.scrollX });
          setShowPopover(true);
          setQuery('');
          setResults([]);
        }
      } else if (showPopover && e.key.length === 1 && /\w/.test(e.key)) {
        const newQuery = query + e.key;
        setQuery(newQuery);
        if (newQuery.length > 1) {
          const res = await api.get(`/api/wikilinks/search?q=${encodeURIComponent(newQuery)}`);
          setResults(res.data || []);
        }
      } else if (e.key === 'Escape' && showPopover) {
        setShowPopover(false);
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showPopover, query]);

  const insertWikiLink = (item) => {
    const sel = window.getSelection();
    const range = sel.getRangeAt(0);
    const linkText = `[[${item.title}]]`;
    range.insertNode(document.createTextNode(linkText));
    range.collapse(false);
    setShowPopover(false);
  };

  const extractPlainText = (edjsData) => {
    try {
      const texts = [];
      (edjsData.blocks || []).forEach((b) => {
        if (b.data?.text) {
          const t = b.data.text.replace(/<[^>]+>/g, '');
          texts.push(t);
        } else if (b.data?.items) {
          texts.push(b.data.items.join(' '));
        }
      });
      return texts.join('\n');
    } catch {
      return '';
    }
  };

  const save = async () => {
    if (!editorRef.current) return;
    setSaving(true);
    try {
      const edjs = await editorRef.current.save();
      const content_text = extractPlainText(edjs);
      await api.put(`/api/documents/${docId}`, { content: edjs, content_text });
      onSaved?.();
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative">
      <div ref={editorHolder} className="bg-white border rounded-xl p-4 min-h-[300px]" />
      <div className="mt-3 flex justify-end">
        <Button onClick={save} loading={saving}>Save</Button>
      </div>
      <WikiLinkPopover
        visible={showPopover}
        position={popoverPos}
        results={results}
        onSelect={(item) => {
          if (!item) setShowPopover(false);
          else insertWikiLink(item);
        }}
      />
    </div>
  );
};

export default DocumentEditor;
