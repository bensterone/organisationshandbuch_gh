import { create } from 'zustand';

export const useNavigationStore = create((set) => ({
  items: [],
  selectedItem: null,
  expandedItems: new Set(),
  
  setItems: (items) => set({ items }),
  setSelectedItem: (item) => set({ selectedItem: item }),
  
  toggleExpanded: (itemId) => set((state) => {
    const expanded = new Set(state.expandedItems);
    if (expanded.has(itemId)) {
      expanded.delete(itemId);
    } else {
      expanded.add(itemId);
    }
    return { expandedItems: expanded };
  })
}));