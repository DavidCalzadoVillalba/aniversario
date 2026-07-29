import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getHighlights as getLocalHighlights, saveHighlights } from './highlightsManager';

export const MEMORIES_STORAGE_KEY = 'eternal_muse_memories';
export const HIGHLIGHTS_STORAGE_KEY = 'gorditos_highlights';
export const STORAGE_BUCKET_NAME = 'memories-bucket';

/**
 * Uploads a compressed image to Supabase Storage bucket 'memories-bucket'.
 * Returns the public URL, or falls back to DataURL if bucket/network is unconfigured.
 */
export async function uploadImageToSupabase(fileOrDataUrl) {
  if (!isSupabaseConfigured || !supabase) {
    return fileOrDataUrl;
  }

  try {
    let blob;
    if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
      const res = await fetch(fileOrDataUrl);
      blob = await res.blob();
    } else if (fileOrDataUrl instanceof Blob || fileOrDataUrl instanceof File) {
      blob = fileOrDataUrl;
    } else {
      return fileOrDataUrl;
    }

    const filename = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.jpg`;

    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(filename, blob, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.warn('Advertencia en Supabase Storage (usando fallback DataURL):', error.message);
      return fileOrDataUrl;
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .getPublicUrl(filename);

    return publicUrlData?.publicUrl || fileOrDataUrl;
  } catch (err) {
    console.error('Error al subir imagen a Supabase Storage:', err);
    return fileOrDataUrl;
  }
}

/**
 * Optionally removes an image from Supabase Storage bucket 'memories-bucket'.
 */
export async function deleteImageFromSupabase(filenameOrUrl) {
  if (!isSupabaseConfigured || !supabase || !filenameOrUrl) return;

  try {
    const filename = filenameOrUrl.split('/').pop();
    if (filename) {
      await supabase.storage.from(STORAGE_BUCKET_NAME).remove([filename]);
    }
  } catch (err) {
    console.warn('Error al eliminar imagen de Supabase Storage:', err);
  }
}

/**
 * Fetches all memories from Supabase table 'memories' or localStorage fallback.
 */
export async function fetchMemories() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('memories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Advertencia al consultar Supabase memories:', error.message);
      } else if (Array.isArray(data)) {
        const formatted = data.map((item) => ({
          id: item.id,
          title: item.title,
          date: item.date,
          categories: Array.isArray(item.categories)
            ? item.categories
            : item.category
            ? [item.category]
            : [],
          category: item.category || (item.categories ? item.categories[0] : ''),
          location: item.location || '',
          image: item.image,
        }));

        localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(formatted));
        return formatted;
      }
    } catch (err) {
      console.warn('Error al consultar Supabase memories (usando fallback local):', err);
    }
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem(MEMORIES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Saves a new memory to Supabase table 'memories' and localStorage.
 * Strips client-generated 'mem_...' IDs on insert to let Supabase auto-generate UUIDs.
 * Returns the saved memory object containing the Supabase-generated UUID.
 */
export async function saveMemoryToCloud(memory) {
  let savedMemory = { ...memory };

  if (isSupabaseConfigured && supabase) {
    try {
      const isClientTempId = !memory.id || String(memory.id).startsWith('mem_');

      const dataToInsert = {
        title: memory.title,
        date: memory.date,
        categories: memory.categories || [],
        category: memory.category || (memory.categories && memory.categories[0]) || '',
        location: memory.location || '',
        image: memory.image,
      };

      if (!isClientTempId) {
        dataToInsert.id = memory.id;
      }

      let res;
      if (isClientTempId) {
        // Insert new record without client temp ID, letting Supabase auto-generate UUID
        res = await supabase.from('memories').insert([dataToInsert]).select();
      } else {
        // Upsert existing record with established ID
        res = await supabase.from('memories').upsert(dataToInsert).select();
      }

      if (res.error) {
        console.warn('Advertencia al guardar memoria en Supabase:', res.error.message);
      } else if (Array.isArray(res.data) && res.data.length > 0) {
        const cloudRecord = res.data[0];
        savedMemory = {
          ...savedMemory,
          id: cloudRecord.id,
          categories: Array.isArray(cloudRecord.categories)
            ? cloudRecord.categories
            : cloudRecord.category
            ? [cloudRecord.category]
            : savedMemory.categories,
          category: cloudRecord.category || savedMemory.category,
        };
      }
    } catch (err) {
      console.error('Error al enviar recuerdo a Supabase:', err);
    }
  }

  // Update localStorage cache with final savedMemory (containing Supabase UUID if available)
  try {
    const stored = localStorage.getItem(MEMORIES_STORAGE_KEY);
    const existing = stored ? JSON.parse(stored) : [];
    const filtered = existing.filter((m) => m.id !== memory.id && m.id !== savedMemory.id);
    const updated = [savedMemory, ...filtered];
    localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Error al guardar en cache local:', e);
  }

  window.dispatchEvent(new CustomEvent('eternal_muse_memory_added', { detail: savedMemory }));
  return savedMemory;
}

/**
 * Deletes a memory from Supabase and localStorage.
 */
export async function deleteMemoryFromCloud(id) {
  try {
    const stored = localStorage.getItem(MEMORIES_STORAGE_KEY);
    if (stored) {
      const existing = JSON.parse(stored);
      const updated = existing.filter((m) => m.id !== id);
      localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error(e);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('memories').delete().eq('id', id);
    } catch (err) {
      console.error('Error al eliminar de Supabase:', err);
    }
  }

  window.dispatchEvent(new CustomEvent('eternal_muse_memory_added'));
}

/**
 * Batch deletes memories from Supabase and localStorage.
 */
export async function batchDeleteMemoriesFromCloud(ids) {
  try {
    const stored = localStorage.getItem(MEMORIES_STORAGE_KEY);
    if (stored) {
      const existing = JSON.parse(stored);
      const updated = existing.filter((m) => !ids.includes(m.id));
      localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error(e);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('memories').delete().in('id', ids);
    } catch (err) {
      console.error('Error en borrado por lote Supabase:', err);
    }
  }

  window.dispatchEvent(new CustomEvent('eternal_muse_memory_added'));
}

/**
 * Batch updates memory categories in Supabase and localStorage.
 */
export async function updateMemoryCategoriesInCloud(targetIds, categories) {
  try {
    const stored = localStorage.getItem(MEMORIES_STORAGE_KEY);
    if (stored) {
      const existing = JSON.parse(stored);
      const updated = existing.map((m) => {
        if (targetIds.includes(m.id)) {
          return {
            ...m,
            categories: categories,
            category: categories[0] || '',
          };
        }
        return m;
      });
      localStorage.setItem(MEMORIES_STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    console.error(e);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      for (const id of targetIds) {
        await supabase
          .from('memories')
          .update({
            categories: categories,
            category: categories[0] || '',
          })
          .eq('id', id);
      }
    } catch (err) {
      console.error('Error al actualizar categorías en Supabase:', err);
    }
  }

  window.dispatchEvent(new CustomEvent('eternal_muse_memory_added'));
}

/**
 * Fetches all highlights from Supabase table 'highlights' or localStorage fallback.
 * Performs query: const { data, error } = await supabase.from('highlights').select('*');
 */
export async function getHighlights() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.from('highlights').select('*');

      if (error) {
        console.warn('Advertencia al consultar Supabase highlights:', error.message);
      } else if (Array.isArray(data)) {
        const formatted = data.map((item) => {
          const coverUrl = item.cover || item.image || '/defecto.webp';
          return {
            id: item.id,
            title: item.title,
            cover: coverUrl,
            image: coverUrl,
            subtitle: item.subtitle || '',
            isFeatured: Boolean(item.is_featured),
          };
        });

        saveHighlights(formatted);
        return formatted;
      }
    } catch (err) {
      console.warn('Error al consultar Supabase highlights:', err);
    }
  }

  const localHighlights = getLocalHighlights();
  return localHighlights.map((h) => {
    const coverUrl = h.cover || h.image || '/defecto.webp';
    return {
      ...h,
      cover: coverUrl,
      image: coverUrl,
    };
  });
}

// Aliases for getHighlights
export const fetchHighlightsFromCloud = getHighlights;
export const fetchHighlights = getHighlights;

/**
 * Saves or updates a highlight in Supabase table 'highlights' and localStorage.
 * Always sends valid `title`, `cover`, and `image` fields.
 */
export async function saveHighlightToCloud(highlight, oldTitle) {
  let savedHighlight = { ...highlight };
  const rawCover = highlight.cover || highlight.image;
  const coverUrl = rawCover || '/defecto.webp';

  savedHighlight.cover = coverUrl;
  savedHighlight.image = coverUrl;

  if (isSupabaseConfigured && supabase) {
    try {
      const isClientTempId = !highlight.id || String(highlight.id).startsWith('hl_');

      const friendlyId = !isClientTempId && highlight.id
        ? highlight.id
        : highlight.title
          ? highlight.title
              .toLowerCase()
              .trim()
              .normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9-]/g, '')
          : undefined;

      const dataToUpsert = {
        title: highlight.title,
        cover: coverUrl || '/defecto.webp',
        image: coverUrl || '/defecto.webp',
        subtitle: highlight.subtitle || 'Destacada',
        is_featured: Boolean(highlight.isFeatured),
      };

      if (friendlyId) {
        dataToUpsert.id = friendlyId;
      }

      let res = await supabase.from('highlights').upsert(dataToUpsert).select();

      if (res.error) {
        console.warn('Advertencia al guardar destacada en Supabase:', res.error.message);
        if (res.error.message?.includes('column')) {
          try {
            const fallbackData = {
              title: highlight.title,
              cover: coverUrl || '/defecto.webp',
              image: coverUrl || '/defecto.webp',
            };
            if (friendlyId) fallbackData.id = friendlyId;
            res = await supabase.from('highlights').upsert(fallbackData).select();
          } catch (e) {
            console.error('Fallback upsert error:', e);
          }
        }
      }

      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const cloudRecord = res.data[0];
        const recordImg = cloudRecord.cover || cloudRecord.image || coverUrl;
        savedHighlight = {
          id: cloudRecord.id || friendlyId || savedHighlight.id,
          title: cloudRecord.title || savedHighlight.title,
          cover: recordImg,
          image: recordImg,
          subtitle: cloudRecord.subtitle || savedHighlight.subtitle,
          isFeatured: Boolean(cloudRecord.is_featured),
        };
      } else if (friendlyId) {
        savedHighlight.id = friendlyId;
      }

      if (oldTitle && oldTitle !== highlight.title) {
        const { data: memories } = await supabase.from('memories').select('*');
        if (Array.isArray(memories)) {
          for (const m of memories) {
            let cats = Array.isArray(m.categories)
              ? [...m.categories]
              : m.category
              ? [m.category]
              : [];
            if (cats.includes(oldTitle)) {
              const updatedCats = cats.map((c) => (c === oldTitle ? highlight.title : c));
              await supabase
                .from('memories')
                .update({
                  categories: updatedCats,
                  category: updatedCats[0] || '',
                })
                .eq('id', m.id);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error al guardar destacada en Supabase:', err);
    }
  }

  const current = getLocalHighlights();
  const filtered = current.filter((h) => h.id !== highlight.id && h.id !== savedHighlight.id);
  saveHighlights([savedHighlight, ...filtered]);
  window.dispatchEvent(new CustomEvent('gorditos_highlights_updated'));

  return savedHighlight;
}

/**
 * Creates a new highlight in Supabase and localStorage.
 * Inserts payload omitting the `id` property so Postgres auto-generates the primary key.
 */
export async function createHighlight(newHighlight) {
  const titleInput = typeof newHighlight === 'string' ? newHighlight : (newHighlight?.title || '');
  const subtitleInput = typeof newHighlight === 'object' ? (newHighlight.subtitle || '') : '';
  const rawCover = typeof newHighlight === 'object' ? (newHighlight.cover || newHighlight.image) : null;
  const coverUrl = rawCover || '/defecto.webp';

  let savedHighlight = {
    title: titleInput.trim(),
    subtitle: subtitleInput ? subtitleInput.trim() : '',
    cover: coverUrl || '/defecto.webp',
    image: coverUrl || '/defecto.webp',
    id: 'hl_' + Date.now(),
    isFeatured: false,
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('highlights')
        .insert([{
          title: titleInput.trim(),
          subtitle: subtitleInput ? subtitleInput.trim() : '',
          cover: coverUrl || '/defecto.webp',
          image: coverUrl || '/defecto.webp'
        }])
        .select();

      if (error) {
        console.warn('Advertencia al insertar destacada en Supabase:', error.message);
      } else if (Array.isArray(data) && data.length > 0) {
        const cloudRecord = data[0];
        const recordImg = cloudRecord.cover || cloudRecord.image || coverUrl;
        savedHighlight = {
          id: cloudRecord.id,
          title: cloudRecord.title,
          subtitle: cloudRecord.subtitle || '',
          cover: recordImg,
          image: recordImg,
          isFeatured: Boolean(cloudRecord.is_featured),
        };
      }
    } catch (err) {
      console.error('Error al crear destacada en Supabase:', err);
    }
  }

  const current = getLocalHighlights();
  saveHighlights([savedHighlight, ...current]);
  window.dispatchEvent(new CustomEvent('gorditos_highlights_updated'));

  return savedHighlight;
}

/**
 * Deletes a highlight from Supabase table 'highlights' and localStorage,
 * and removes its tag from memories in Supabase without deleting photo rows.
 */
export async function deleteHighlightFromCloud(id, targetTitle) {
  if (isSupabaseConfigured && supabase) {
    try {
      // 1. Delete highlight row directly from Supabase highlights table
      if (id && !String(id).startsWith('hl_')) {
        await supabase.from('highlights').delete().eq('id', id);
      }
      if (targetTitle) {
        await supabase.from('highlights').delete().eq('title', targetTitle);
      }

      // 2. Remove category string from memories in Supabase without deleting photo rows
      if (targetTitle) {
        const { data: memories, error } = await supabase.from('memories').select('*');
        if (!error && Array.isArray(memories)) {
          for (const m of memories) {
            let cats = Array.isArray(m.categories)
              ? [...m.categories]
              : m.category
              ? [m.category]
              : [];

            if (cats.includes(targetTitle)) {
              const updatedCats = cats.filter((c) => c !== targetTitle);
              await supabase
                .from('memories')
                .update({
                  categories: updatedCats,
                  category: updatedCats[0] || '',
                })
                .eq('id', m.id);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error al eliminar destacada de Supabase:', err);
    }
  }

  // 3. Update localStorage cache and dispatch global events
  deleteHighlight(id, targetTitle);
  window.dispatchEvent(new CustomEvent('gorditos_highlights_updated'));
  window.dispatchEvent(new CustomEvent('eternal_muse_memory_added'));
}

/**
 * Subscribes to Supabase Realtime changes for instant multi-device sync.
 * Creates channel, attaches .on() listeners for 'highlights' and 'memories', calls .subscribe() and returns channel.
 */
export const subscribeToRealtimeSync = (onMemoriesChange, onHighlightsChange) => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const channel = supabase.channel('gorditos-changes');

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'highlights' },
        (payload) => {
          if (onHighlightsChange) onHighlightsChange(payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories' },
        (payload) => {
          if (onMemoriesChange) onMemoriesChange(payload);
        }
      )
      .subscribe();

    return channel;
  } catch (err) {
    console.warn('Error en la suscripción Realtime Supabase:', err);
    return null;
  }
};

