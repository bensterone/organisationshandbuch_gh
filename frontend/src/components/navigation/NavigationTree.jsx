// frontend/src/components/navigation/NavigationTree.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import { ChevronRight, ChevronDown, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/authStore";
import { useNavigationStore } from "../../stores/navigationStore";
import NewItemModal from "./NewItemModal";
import api from "../../services/api";

import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  restrictToVerticalAxis,
  restrictToFirstScrollableAncestor,
} from "@dnd-kit/modifiers";

/* ---------------------------
   Helpers
----------------------------*/
const flattenTree = (items, parentId = null, depth = 0) =>
  (items || []).reduce((acc, item) => {
    acc.push({ ...item, parentId, depth });
    if (item.children?.length) {
      acc = acc.concat(flattenTree(item.children, item.id, depth + 1));
    }
    return acc;
  }, []);

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
    if (index == null) nodes.push(item);
    else nodes.splice(index, 0, item);
    return;
  }
  const parent = findNodeById(nodes, parentId);
  if (!parent) return;
  if (!Array.isArray(parent.children)) parent.children = [];
  if (index == null) parent.children.push(item);
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

/* ---------------------------
   Sortable row (handle-only)
----------------------------*/
const SortableRow = ({ id, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return children({
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    style,
    isDragging,
  });
};

/* ---------------------------
   Component
----------------------------*/
const NavigationTree = () => {
  const { items, setItems, expandedItems, toggleExpanded } = useNavigationStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [editingItemId, setEditingItemId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  const [draggingId, setDraggingId] = useState(null);
  const [draggingItem, setDraggingItem] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);
  const [dropPosition, setDropPosition] = useState(null); // "above" | "inside" | "below"

  const hoverTimer = useRef(null);
  const lastInsideFolderIdRef = useRef(null);
  const lastOverIdRef = useRef(null); // remember last valid drop target

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }, // slight nudge to start dragging
    })
  );

  const reloadItems = useCallback(async () => {
    const res = await api.get("/navigation");
    const data = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
    setItems(data);
  }, [setItems]);

  useEffect(() => {
    reloadItems();
  }, [reloadItems]);

  const updateTitle = async (itemId, newTitle) => {
    try {
      await api.put(`navigation/${itemId}`, { title: newTitle });
      await reloadItems();
    } catch {
      alert("Failed to rename item");
    }
  };

  /* ---------------------------
     DnD
  ----------------------------*/
  const handleDragStart = (event) => {
    setDraggingId(event.active.id);
    const flat = flattenTree(items);
    setDraggingItem(flat.find((n) => n.id === event.active.id) || null);
    lastInsideFolderIdRef.current = null;
    lastOverIdRef.current = null;
  };

  const handleDragOver = (event) => {
    const { over } = event;

    if (!over) {
      setDropTargetId(null);
      lastInsideFolderIdRef.current = null;
      return;
    }

    lastOverIdRef.current = over.id;

    const overId = over.id;
    const el = document.querySelector(`[data-id="${overId}"]`);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const cursorY = event.delta.y + event.active.rect.current.initial.top;
    const relY = cursorY - rect.top;

    // Top 20% => above, bottom 20% => below, middle 60% => inside
    const topZone = rect.height * 0.2;
    const bottomZone = rect.height * 0.8;

    let position = "inside";
    if (relY < topZone) position = "above";
    else if (relY > bottomZone) position = "below";

    setDropTargetId(overId);
    setDropPosition(position);

    // Auto-expand + remember intended folder when hovering "inside"
    const flatTree = flattenTree(items);
    const node = flatTree.find((n) => n.id === overId);

    if (node?.type === "folder") {
      if (position === "inside") {
        lastInsideFolderIdRef.current = node.id;
      }
      if (!expandedItems.has(node.id) && position === "inside") {
        clearTimeout(hoverTimer.current);
        hoverTimer.current = setTimeout(() => toggleExpanded(node.id), 150);
      }
    }
  };

  const handleDragEnd = async (event) => {
    clearTimeout(hoverTimer.current);
    const { active, over } = event;

    // derive a safe target even if pointer left the list momentarily
    const effectiveOverId = over?.id ?? lastOverIdRef.current;

    setDropTargetId(null);
    setDropPosition(null);
    setDraggingId(null);
    setDraggingItem(null);

    if (!effectiveOverId) return;

    const flat = flattenTree(items);
    const dragged = flat.find((n) => n.id === active.id);
    const target = flat.find((n) => n.id === effectiveOverId);
    if (!dragged || !target) return;

    let newParentId = target.parentId;
    let insertIndex = null;

    // Prefer the most recent folder hovered "inside" (sticky target)
    const stickyFolderId = lastInsideFolderIdRef.current;
    if (stickyFolderId) {
      newParentId = stickyFolderId;
      const parentNode = findNodeById(items, newParentId);
      insertIndex = parentNode?.children?.length || 0;
    } else if (dropPosition === "inside" && target.type === "folder") {
      newParentId = target.id;
      const parentNode = findNodeById(items, newParentId);
      insertIndex = parentNode?.children?.length || 0;
    } else {
      const parentNode =
        target.parentId === null ? { children: items } : findNodeById(items, target.parentId);
      const targetIdx = parentNode?.children?.findIndex((c) => c.id === target.id) ?? -1;
      insertIndex = dropPosition === "above" ? targetIdx : targetIdx + 1;
    }

    lastInsideFolderIdRef.current = null;

    const updatedTree = moveItemToParentAtIndex(items, dragged.id, newParentId, insertIndex);
    setItems(updatedTree);

    try {
      const payload = buildReorderPayload(updatedTree);
      await api.put("navigation/reorder", payload);
    } catch (err) {
      console.error("Reorder failed:", err);
      // Optional: await reloadItems();
    }
  };

  /* ---------------------------
     Open item
  ----------------------------*/
  const openProcess = async (navigationItemId) => {
    try {
      const res = await api.get(`processes/by-navigation/${navigationItemId}`);
      navigate(`/processes/${res.data.id}`);
    } catch {
      alert("No process definition found for this item");
    }
  };

  /* ---------------------------
     Tree row
  ----------------------------*/
  const TreeNode = ({ item, level = 0 }) => {
    const isExpanded = expandedItems.has(item.id);
    const hasChildren = item.children?.length > 0;

    const handleClick = () => {
      if (item.type === "folder") {
        toggleExpanded(item.id);
      } else if (item.type === "process") {
        openProcess(item.id);
      } else {
        navigate(`/documents/${item.id}`);
      }
    };

    const showLineAbove = dropTargetId === item.id && dropPosition === "above";
    const showLineBelow = dropTargetId === item.id && dropPosition === "below";

    return (
      <div data-id={item.id} className="relative">
        {showLineAbove && <div className="h-[2px] bg-blue-400/50 rounded-full mx-2 mb-1" />}

        <SortableRow id={item.id}>
          {({ setNodeRef, setActivatorNodeRef, listeners, style }) => (
            <div ref={setNodeRef} style={style}>
              <div
                className="flex items-center py-1.5 px-2 rounded cursor-pointer hover:bg-gray-100"
                style={{ paddingLeft: `${level * 16 + 6}px` }}
                onClick={handleClick}
              >
                {(user?.role === "admin" || user?.role === "editor") && (
                  <span
                    ref={setActivatorNodeRef}
                    {...listeners}
                    className="mr-1 inline-flex items-center justify-center w-4 h-4 text-gray-300 cursor-grab hover:text-gray-500"
                    title="Drag to reorder"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <GripVertical className="w-4 h-4" />
                  </span>
                )}

                {item.type === "folder" ? (
                  isExpanded ? (
                    <ChevronDown className="w-4 h-4 mr-1" />
                  ) : (
                    <ChevronRight className="w-4 h-4 mr-1" />
                  )
                ) : (
                  <span className="w-4 h-4 mr-1" />
                )}

                <span className="mr-2 text-lg">
                  {item.type === "folder" ? "📁" : item.type === "process" ? "🔀" : "📄"}
                </span>

                {editingItemId === item.id ? (
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter") {
                        if (editTitle.trim() && editTitle !== item.title) {
                          await updateTitle(item.id, editTitle);
                        }
                        setEditingItemId(null);
                      } else if (e.key === "Escape") {
                        setEditingItemId(null);
                      }
                    }}
                    onBlur={async () => {
                      if (editTitle.trim() && editTitle !== item.title) {
                        await updateTitle(item.id, editTitle);
                      }
                      setEditingItemId(null);
                    }}
                    autoFocus
                    className="text-sm border rounded px-1 py-0.5 w-full"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="text-sm rounded px-1"
                    title="Double-click to rename"
                    onDoubleClick={() => {
                      if (user?.role === "admin" || user?.role === "editor") {
                        setEditingItemId(item.id);
                        setEditTitle(item.title);
                      }
                    }}
                  >
                    {item.title}
                  </span>
                )}
              </div>
            </div>
          )}
        </SortableRow>

        {showLineBelow && <div className="h-[2px] bg-blue-400/50 rounded-full mx-2 mt-1" />}

        {hasChildren && isExpanded && (
          <div className="ml-4 border-l border-dotted border-gray-300/70">
            {item.children.map((child) => (
              <TreeNode key={child.id} item={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const flatIds = flattenTree(items).map((n) => n.id);

  return (
    <div className="h-full flex flex-col">
      {/* Tiny toolbar */}
      <div className="flex items-center justify-between px-2 py-2 border-b">
        <div className="text-sm font-semibold text-gray-700">Navigation</div>
        {(user?.role === "admin" || user?.role === "editor") && (
          <button
            onClick={() => setShowNewModal(true)}
            className="text-xs bg-primary-600 text-white px-2.5 py-1.5 rounded hover:bg-primary-700"
          >
            + New
          </button>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={flatIds}>
            {items.map((item) => (
              <TreeNode key={item.id} item={item} />
            ))}
          </SortableContext>

          <DragOverlay>
            {draggingItem ? (
              <div className="flex items-center px-3 py-1.5 bg-white rounded-lg shadow border">
                <span className="mr-2 text-lg">{draggingItem.icon || "📄"}</span>
                <span className="text-sm font-medium text-gray-800">
                  {draggingItem.title}
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {showNewModal && (
        <NewItemModal onClose={() => setShowNewModal(false)} onCreated={reloadItems} />
      )}
    </div>
  );
};

export default NavigationTree;
