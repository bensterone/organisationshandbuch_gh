import React, { useEffect, useState, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FileText,
  Plus,
  GripVertical,
  GitBranch,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useNavigationStore } from '../../stores/navigationStore';
import NewItemModal from './NewItemModal';
import EmojiPickerPopover from '../common/EmojiPickerPopover';
import api from '../../services/api';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
} from '@dnd-kit/core';
import { SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/* --------------------------
   Utility Functions
---------------------------*/
const flattenTree = (items, parentId = null, depth = 0) => {
  return items.reduce((acc, item) => {
    acc.push({ ...item, parentId, depth });
    if (item.children && item.children.length > 0) {
      acc = acc.concat(flattenTree(item.children, item.id, depth + 1));
    }
    return acc;
  }, []);
};

const findNodeById = (nodes, id) => {
  for (const node of nodes) {
    if (node.id === id) return node;
    const child = findNodeById(node.children || [], id);
    if (child) return child;
  }
  return null;
};

const removeItem = (nodes, id) => {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) return nodes.splice(i, 1)[0];
    if (nodes[i].children?.length) {
      const found = removeItem(nodes[i].children, id);
      if (found) return found;
    }
  }
  return null;
};

const insertIntoParent = (nodes, parentId, item, index) => {
  if (parentId === null) {
    if (index === undefined || index === null) nodes.push(item);
    else nodes.splice(index, 0, item);
    return;
  }
  const parent = findNodeById(nodes, parentId);
  if (!parent) return;
  if (!Array.isArray(parent.children)) parent.children = [];
  if (index === undefined || index === null) parent.children.push(item);
  else parent.children.splice(index, 0, item);
};

const moveItemToParentAtIndex = (tree, itemId, newParentId, index) => {
  const cloned = JSON.parse(JSON.stringify(tree));
  const item = removeItem(cloned, itemId);
  if (!item) return cloned;
  insertIntoParent(cloned, newParentId, item, index);
  return cloned;
};

const buildReorderPayload = (nodes, parentId = null, acc = []) => {
  (nodes || []).forEach((n, idx) => {
    acc.push({ id: n.id, parent_id: parentId, sort_order: idx });
    if (n.children?.length) buildReorderPayload(n.children, n.id, acc);
  });
  return acc;
};

/* --------------------------
   Sortable Item Wrapper
---------------------------*/
const SortableItem = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
};

/* --------------------------
   Component
---------------------------*/
const NavigationTree = () => {
  const { items, setItems, expandedItems, toggleExpanded } = useNavigationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [editingItemId, setEditingItemId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const [draggingItem, setDraggingItem] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // 'above' | 'below' | 'inside'

  const hoverTimer = useRef(null);
  const sensors = useSensors(useSensor(PointerSensor));

  /* --------------------------
     Fetch and Update
  ---------------------------*/
  const reloadItems = async () => {
    const res = await api.get('/api/navigation');
    setItems(res.data);
  };

  useEffect(() => {
    reloadItems();
  }, []);

  const updateTitle = async (itemId, newTitle) => {
    try {
      await api.put(`/api/navigation/${itemId}`, { title: newTitle });
      await reloadItems();
    } catch {
      alert('Failed to rename item');
    }
  };

  /* --------------------------
     Drag & Drop Handlers
  ---------------------------*/
  const handleDragStart = (event) => {
    setDraggingId(event.active.id);
    const flat = flattenTree(items);
    const item = flat.find((n) => n.id === event.active.id);
    setDraggingItem(item || null);
  };

  const handleDragOver = (event) => {
    const { over, delta, active } = event;
    if (!over) {
      setDropTargetId(null);
      return;
    }

    const overId = over.id;
    const target = document.querySelector(`[data-id="${overId}"]`);
    if (!target) return;

    const rect = target.getBoundingClientRect();
    const cursorY = event.delta.y + event.active.rect.current.initial.top;
    const relativeY = cursorY - rect.top;

    let position = 'inside';
    if (relativeY < rect.height * 0.25) position = 'above';
    else if (relativeY > rect.height * 0.75) position = 'below';

    setDropTargetId(overId);
    setDropPosition(position);

    // Auto-expand on hover
    const flatTree = flattenTree(items);
    const node = flatTree.find((n) => n.id === overId);
    if (node?.type === 'folder' && position === 'inside' && !expandedItems.has(node.id)) {
      clearTimeout(hoverTimer.current);
      hoverTimer.current = setTimeout(() => toggleExpanded(node.id), 400);
    }
  };

  const handleDragEnd = async (event) => {
    clearTimeout(hoverTimer.current);
    setDropTargetId(null);
    setDropPosition(null);
    const { active, over } = event;
    setDraggingId(null);
    setDraggingItem(null);
    if (!over) return;

    const flat = flattenTree(items);
    const dragged = flat.find((n) => n.id === active.id);
    const target = flat.find((n) => n.id === over.id);
    if (!dragged || !target) return;

    let newParentId = target.parentId;
    let insertIndex = null;

    if (dropPosition === 'inside' && target.type === 'folder') {
      newParentId = target.id;
      const parentNode = findNodeById(items, newParentId);
      insertIndex = parentNode?.children?.length || 0;
    } else {
      const parentNode =
        target.parentId === null ? { children: items } : findNodeById(items, target.parentId);
      const targetIdx = parentNode?.children?.findIndex((c) => c.id === target.id) ?? -1;
      insertIndex = dropPosition === 'above' ? targetIdx : targetIdx + 1;
    }

    const updatedTree = moveItemToParentAtIndex(items, dragged.id, newParentId, insertIndex);
    setItems(updatedTree);

    try {
      const payload = buildReorderPayload(updatedTree);
      await api.put('/api/navigation/reorder', payload);
    } catch (err) {
      console.error('Reorder failed:', err);
    }
  };

  /* --------------------------
     Process Open
  ---------------------------*/
  const openProcess = async (navigationItemId) => {
    try {
      const res = await api.get(`/api/processes/by-navigation/${navigationItemId}`);
      navigate(`/processes/${res.data.id}`);
    } catch {
      alert('No process definition found for this item');
    }
  };

  /* --------------------------
     Recursive TreeNode
  ---------------------------*/
  const TreeNode = ({ item, level = 0 }) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children?.length > 0;
    const Icon =
      item.type === 'folder' ? Folder : item.type === 'process' ? GitBranch : FileText;

    const handleClick = () => {
      if (item.type === 'folder') toggleExpanded(item.id);
      else if (item.type === 'document') navigate(`/documents/${item.id}`);
      else if (item.type === 'process') openProcess(item.id);
    };

    const showLineAbove = dropTargetId === item.id && dropPosition === 'above';
    const showLineBelow = dropTargetId === item.id && dropPosition === 'below';

    return (
      <div data-id={item.id} className="relative">
        {/* Vertical indentation lines */}
        {level > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 border-l border-dotted border-gray-300/70"
            style={{ marginLeft: `${level * 20}px` }}
          ></div>
        )}

        {showLineAbove && (
          <div className="h-[2px] bg-blue-400/50 rounded-full mx-2 mb-1 transition-all duration-100" />
        )}

        <SortableItem id={item.id}>
          <div
            className={`flex items-center py-1.5 px-2 rounded cursor-pointer select-none transition-all relative
              ${
                draggingId === item.id
                  ? 'bg-blue-100/70 shadow-inner'
                  : dropTargetId === item.id && dropPosition === 'inside'
                  ? 'bg-blue-50/70 border border-blue-300/30 shadow-sm'
                  : item.id === editingItemId
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-100'
              }`}
            style={{ paddingLeft: `${level * 20 + 8}px` }}
            onClick={handleClick}
          >
            {(user?.role === 'admin' || user?.role === 'editor') && (
              <GripVertical className="w-4 h-4 text-gray-300 mr-1 cursor-grab" />
            )}

            {item.type === 'folder' && hasChildren && (
              isExpanded ? (
                <ChevronDown className="w-4 h-4 mr-1" />
              ) : (
                <ChevronRight className="w-4 h-4 mr-1" />
              )
            )}

            {(user?.role === 'admin' || user?.role === 'editor') ? (
              <EmojiPickerPopover
                onSelect={async (emoji) => {
                  await api.put(`/api/navigation/${item.id}/icon`, { icon: emoji });
                  await reloadItems();
                }}
              >
                <span className="mr-2 text-lg">{item.icon || '📄'}</span>
              </EmojiPickerPopover>
            ) : (
              <span className="mr-2 text-lg">{item.icon || '📄'}</span>
            )}

            {editingItemId === item.id ? (
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    if (editTitle.trim() && editTitle !== item.title)
                      await updateTitle(item.id, editTitle);
                    setEditingItemId(null);
                  } else if (e.key === 'Escape') {
                    setEditingItemId(null);
                  }
                }}
                onBlur={async () => {
                  if (editTitle.trim() && editTitle !== item.title)
                    await updateTitle(item.id, editTitle);
                  setEditingItemId(null);
                }}
                autoFocus
                className="text-sm border border-primary-300 rounded px-1 py-0.5 w-full"
              />
            ) : (
              <span
                className="text-sm cursor-pointer hover:bg-gray-100 rounded px-1"
                title={
                  user?.role === 'editor' || user?.role === 'admin'
                    ? 'Double-click to rename'
                    : ''
                }
                onDoubleClick={() => {
                  if (user?.role === 'admin' || user?.role === 'editor') {
                    setEditingItemId(item.id);
                    setEditTitle(item.title);
                  }
                }}
              >
                {item.title}
              </span>
            )}
          </div>
        </SortableItem>

        {showLineBelow && (
          <div className="h-[2px] bg-blue-400/50 rounded-full mx-2 mt-1 transition-all duration-100" />
        )}

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="border-l border-dotted border-gray-300/70 ml-[20px]">
            {item.children.map((child) => (
              <TreeNode key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const flatIds = flattenTree(items).map((n) => n.id);

  const DragGhost = ({ item }) => {
    if (!item) return null;
    return (
      <div className="flex items-center px-3 py-1.5 bg-white rounded-lg shadow-lg border border-gray-200 opacity-90">
        <span className="mr-2 text-lg">{item.icon || '📄'}</span>
        <span className="text-sm font-medium text-gray-800">{item.title}</span>
      </div>
    );
  };

  /* --------------------------
     Render
  ---------------------------*/
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">Navigation</h2>
        {(user?.role === 'admin' || user?.role === 'editor') && (
          <button
            onClick={() => setShowNewModal(true)}
            className="text-sm bg-primary-600 text-white px-3 py-1.5 rounded-lg hover:bg-primary-700 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> New
          </button>
        )}
      </div>

      {/* Tree with Hierarchical DnD */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={flatIds}>
          {items.map((item) => (
            <TreeNode key={item.id} item={item} />
          ))}
        </SortableContext>

        <DragOverlay>{draggingItem ? <DragGhost item={draggingItem} /> : null}</DragOverlay>
      </DndContext>

      {/* Modal */}
      {showNewModal && (
        <NewItemModal onClose={() => setShowNewModal(false)} onCreated={reloadItems} />
      )}
    </div>
  );
};

export default NavigationTree;
