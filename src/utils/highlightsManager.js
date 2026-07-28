/**
 * Storage & Manager for Highlights (Historias Destacadas) in Gorditos.
 */

export const HIGHLIGHTS_STORAGE_KEY = 'gorditos_highlights';
export const MEMORIES_STORAGE_KEY = 'eternal_muse_memories';

export const DEFAULT_HIGHLIGHTS = [
  {
    id: 'hl_1',
    title: 'Nuestra Historia',
    image: '/images/story_nuestra_historia.png',
    subtitle: 'El origen de todo',
    isFeatured: true,
  },
  {
    id: 'hl_2',
    title: 'París',
    image: '/images/card_travel.png',
    subtitle: 'La ciudad del amor',
    isFeatured: false,
  },
  {
    id: 'hl_3',
    title: 'Aniversario',
    image: '/images/card_highlights.png',
    subtitle: 'Celebraciones',
    isFeatured: false,
  },
  {
    id: 'hl_4',
    title: 'Viajes',
    image: '/images/card_travel.png',
    subtitle: 'Aventuras juntas',
    isFeatured: false,
  },
  {
    id: 'hl_5',
    title: 'Momentos',
    image: '/images/story_nuestra_historia.png',
    subtitle: 'Fotos espontáneas',
    isFeatured: false,
  },
];

/**
 * Gets highlights list from localStorage or initializes with defaults.
 * @returns {Array} List of highlights
 */
export function getHighlights() {
  try {
    const stored = localStorage.getItem(HIGHLIGHTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Initialize with defaults if empty
    localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(DEFAULT_HIGHLIGHTS));
    return DEFAULT_HIGHLIGHTS;
  } catch (e) {
    console.error('Error al cargar destacadas de localStorage:', e);
    return DEFAULT_HIGHLIGHTS;
  }
}

/**
 * Saves highlights array to localStorage and dispatches global event.
 * @param {Array} highlights 
 */
export function saveHighlights(highlights) {
  try {
    localStorage.setItem(HIGHLIGHTS_STORAGE_KEY, JSON.stringify(highlights));
    window.dispatchEvent(new CustomEvent('gorditos_highlights_updated', { detail: highlights }));
  } catch (e) {
    console.error('Error al guardar destacadas en localStorage:', e);
  }
}

/**
 * Adds a new highlight item.
 * @param {Object} newHighlight - { title, image, subtitle }
 */
export function addHighlight(newHighlight) {
  const current = getHighlights();
  const item = {
    id: 'hl_' + Date.now(),
    title: newHighlight.title.trim(),
    image: newHighlight.image || '/images/story_nuestra_historia.png',
    subtitle: newHighlight.subtitle?.trim() || 'Destacada',
    isFeatured: current.length === 0,
  };
  const updated = [...current, item];
  saveHighlights(updated);
  return updated;
}

/**
 * Updates an existing highlight by ID.
 * @param {string} id 
 * @param {Object} updatedData - { title, image, subtitle }
 */
export function updateHighlight(id, updatedData) {
  const current = getHighlights();
  const oldItem = current.find((h) => h.id === id);
  if (!oldItem) return current;

  const oldTitle = oldItem.title;
  const newTitle = updatedData.title.trim();

  const updated = current.map((h) => {
    if (h.id === id) {
      return {
        ...h,
        title: newTitle,
        image: updatedData.image || h.image,
        subtitle: updatedData.subtitle !== undefined ? updatedData.subtitle.trim() : h.subtitle,
      };
    }
    return h;
  });

  saveHighlights(updated);

  // If title changed, update memories that had the old category title
  if (oldTitle !== newTitle) {
    try {
      const storedMemories = localStorage.getItem(MEMORIES_STORAGE_KEY);
      if (storedMemories) {
        const memories = JSON.parse(storedMemories);
        if (Array.isArray(memories)) {
          const updatedMemories = memories.map((m) => {
            let cats = Array.isArray(m.categories) ? [...m.categories] : (m.category ? [m.category] : []);
            if (cats.includes(oldTitle)) {
              cats = cats.map((c) => (c === oldTitle ? newTitle : c));
            }
            return {
              ...m,
              categories: cats,
              category: cats[0] || 'Nuestra Historia',
            };
          });
          localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(updatedMemories));
          window.dispatchEvent(new CustomEvent('eternal_muse_memory_added'));
        }
      }
    } catch (e) {
      console.error('Error al actualizar categorías en los recuerdos:', e);
    }
  }

  return updated;
}

/**
 * Deletes a highlight by ID.
 * CRITICAL RULE: Removes ONLY the highlight definition from localStorage.
 * Photos are NOT deleted; instead, this highlight title is removed from the `categories` array of associated photos.
 * @param {string} id 
 */
export function deleteHighlight(id) {
  const current = getHighlights();
  const target = current.find((h) => h.id === id);
  if (!target) return current;

  const targetTitle = target.title;
  const updatedHighlights = current.filter((h) => h.id !== id);

  // If the erased item was featured, make the first item featured
  if (target.isFeatured && updatedHighlights.length > 0) {
    updatedHighlights[0].isFeatured = true;
  }

  saveHighlights(updatedHighlights);

  // Remove the category string from memories without deleting photos
  try {
    const storedMemories = localStorage.getItem(MEMORIES_STORAGE_KEY);
    if (storedMemories) {
      const memories = JSON.parse(storedMemories);
      if (Array.isArray(memories)) {
        const updatedMemories = memories.map((m) => {
          let cats = Array.isArray(m.categories) ? m.categories : (m.category ? [m.category] : []);
          cats = cats.filter((c) => c !== targetTitle);
          return {
            ...m,
            categories: cats,
            category: cats[0] || '',
          };
        });
        localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(updatedMemories));
        window.dispatchEvent(new CustomEvent('eternal_muse_memory_added'));
      }
    }
  } catch (e) {
    console.error('Error al remover categoría eliminada de los recuerdos:', e);
  }

  return updatedHighlights;
}
