/**
 * Storage utilities for memories. Default initial state is empty array.
 */
export const INITIAL_MOCK_MEMORIES = [];

export const STORAGE_KEY = 'eternal_muse_memories';

/**
 * Checks localStorage for memories. Initializes with [] if empty.
 * @returns {Array} List of memories currently in localStorage
 */
export function initializeStorageIfNeeded() {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(existing);
    if (!Array.isArray(parsed)) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    return parsed;
  } catch (e) {
    console.error('Error al consultar almacenamiento local:', e);
    return [];
  }
}
