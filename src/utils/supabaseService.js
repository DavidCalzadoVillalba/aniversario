import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { getHighlights, saveHighlights } from './highlightsManager';

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
 */
export async function fetchHighlightsFromCloud() {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('highlights')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Advertencia al consultar Supabase highlights (fallback local):', error.message);
      } else if (Array.isArray(data) && data.length > 0) {
        const formatted = data.map((item) => ({
          id: item.id,
          title: item.title,
          image: item.image,
          subtitle: item.subtitle || '',
          isFeatured: Boolean(item.is_featured),
        }));

        saveHighlights(formatted);
        return formatted;
      }
    } catch (err) {
      console.warn('Error al consultar Supabase highlights:', err);
    }
  }

  return getHighlights();
}

/**
 * Saves or updates a highlight in Supabase and localStorage.
 */
export async function saveHighlightToCloud(highlight) {
  const current = getHighlights();
  const updated = [...current.filter((h) => h.id !== highlight.id), highlight];
  saveHighlights(updated);

  if (isSupabaseConfigured && supabase) {
    try {
      const isClientTempId = !highlight.id || String(highlight.id).startsWith('hl_');

      const dataToInsert = {
        title: highlight.title,
        image: highlight.image,
        subtitle: highlight.subtitle,
        is_featured: highlight.isFeatured,
      };

      if (!isClientTempId) {
        dataToInsert.id = highlight.id;
      }

      if (isClientTempId) {
        await supabase.from('highlights').insert([dataToInsert]).select();
      } else {
        await supabase.from('highlights').upsert(dataToInsert).select();
      }
    } catch (err) {
      console.error('Error al guardar destacada en Supabase:', err);
    }
  }
}

/**
 * Deletes a highlight from Supabase and localStorage.
 */
export async function deleteHighlightFromCloud(id) {
  const current = getHighlights();
  const updated = current.filter((h) => h.id !== id);
  saveHighlights(updated);

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('highlights').delete().eq('id', id);
    } catch (err) {
      console.error('Error al eliminar destacada de Supabase:', err);
    }
  }
}

/**
 * Subscribes to Supabase Realtime changes for instant multi-device sync.
 * Creates channel, attaches .on() listeners, calls .subscribe() and returns channel.
 */
export const subscribeToRealtimeSync = (onMemoriesChange, onHighlightsChange) => {
  if (!isSupabaseConfigured || !supabase) return null;

  try {
    const channel = supabase.channel('gorditos-changes');

    channel
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'memories' },
        (payload) => {
          if (onMemoriesChange) onMemoriesChange(payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'highlights' },
        (payload) => {
          if (onHighlightsChange) onHighlightsChange(payload);
        }
      )
      .subscribe();

    return channel;
  } catch (err) {
    console.warn('Error en la suscripción Realtime Supabase:', err);
    return null;
  }
};
