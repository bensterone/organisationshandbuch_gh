import api from './api';

/**
 * Fetch all navigation items (flat list)
 * Returns [{ id, title, parent_id, status, type }, ...]
 */
export async function getNavigationList() {
  try {
    const res = await api.get('/api/navigation');
    return res.data.items || [];
  } catch (e) {
    console.error('❌ Failed to load navigation list:', e);
    throw e;
  }
}

/**
 * Fetch a single navigation item by ID.
 * Returns { id, title, parent_id, status, type }
 */
export async function getNavigationItem(id) {
  try {
    const res = await api.get(`/api/navigation/${id}`);
    return res.data;
  } catch (e) {
    console.error(`❌ Failed to load navigation item ${id}:`, e);
    throw e;
  }
}

/**
 * Fetch full hierarchical navigation tree.
 * Returns [{ id, title, type, status, children: [...] }, ...]
 */
export async function getNavigationTree() {
  try {
    const res = await api.get('/api/navigation/tree');
    return res.data.tree || [];
  } catch (e) {
    console.error('❌ Failed to load navigation tree:', e);
    throw e;
  }
}

/**
 * Update the status of a navigation item.
 * Example: await updateNavigationStatus(12, 'approved')
 */
export async function updateNavigationStatus(id, status) {
  try {
    await api.put(`/api/navigation/${id}/status`, { status });
    return true;
  } catch (e) {
    console.error(`❌ Failed to update navigation status for ${id}:`, e);
    throw e;
  }
}

/**
 * Helper: Flatten a nested tree into a flat list.
 * Useful for Smart Discovery or semantic scoring.
 */
export function flattenNavigationTree(tree) {
  const flat = [];
  function traverse(nodes) {
    for (const node of nodes) {
      flat.push({ id: node.id, title: node.title, type: node.type, status: node.status });
      if (node.children && node.children.length > 0) traverse(node.children);
    }
  }
  traverse(tree);
  return flat;
}

/**
 * Simple local search utility for navigation trees.
 * Performs a case-insensitive partial match on title.
 *
 * Example:
 * const tree = await getNavigationTree();
 * const results = searchNavigation(flattenNavigationTree(tree), "onboarding");
 */
export function searchNavigation(items, query) {
  if (!query || !Array.isArray(items)) return [];
  const q = query.trim().toLowerCase();

  // prioritize title matches, but allow type matches too
  return items
    .map(item => {
      const titleMatch = item.title.toLowerCase().includes(q);
      const typeMatch = item.type?.toLowerCase().includes(q);
      if (!titleMatch && !typeMatch) return null;
      const score = titleMatch ? 2 : 1; // title match > type match
      return { ...item, score };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

/**
 * Advanced fuzzy search (optional enhancement).
 * Performs partial word match and prioritizes closer Levenshtein distances.
 */
export function fuzzySearchNavigation(items, query, threshold = 0.5) {
  if (!query || !Array.isArray(items)) return [];
  const q = query.trim().toLowerCase();

  function similarity(a, b) {
    if (!a || !b) return 0;
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    const longerLength = longer.length;
    const editDistance = levenshtein(longer, shorter);
    return (longerLength - editDistance) / longerLength;
  }

  function levenshtein(a, b) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        matrix[i][j] =
          b.charAt(i - 1) === a.charAt(j - 1)
            ? matrix[i - 1][j - 1]
            : Math.min(
                matrix[i - 1][j - 1] + 1, // substitution
                matrix[i][j - 1] + 1,     // insertion
                matrix[i - 1][j] + 1      // deletion
              );
      }
    }
    return matrix[b.length][a.length];
  }

  const matches = items
    .map(item => {
      const score = similarity(item.title.toLowerCase(), q);
      return { ...item, score };
    })
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score);

  return matches;
}
