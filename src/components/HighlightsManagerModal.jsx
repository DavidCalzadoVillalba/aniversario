import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Pencil, Trash2, ImagePlus, Sparkles, CheckCircle2 } from 'lucide-react';
import { fetchHighlights, createHighlight, saveHighlightToCloud, deleteHighlightFromCloud, uploadImageToSupabase } from '../utils/supabaseService';
import { compressImage } from '../utils/imageCompressor';

export default function HighlightsManagerModal({ onClose }) {
  const [highlights, setHighlights] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Form State for creating/editing
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [rawFile, setRawFile] = useState(null);

  const [toastMsg, setToastMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const loadData = async () => {
    const list = await fetchHighlights();
    setHighlights(list);
  };

  useEffect(() => {
    loadData();
    const handleHighlightsUpdated = () => loadData();
    window.addEventListener('gorditos_highlights_updated', handleHighlightsUpdated);
    return () => {
      window.removeEventListener('gorditos_highlights_updated', handleHighlightsUpdated);
    };
  }, []);

  // Helper to handle cover image processing
  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Por favor, selecciona un archivo de imagen válido.');
        return;
      }
      setErrorMsg(null);
      setRawFile(file);

      try {
        const compressed = await compressImage(file, 800, 0.7);
        setCoverImage(compressed);
      } catch (err) {
        console.error('Error al comprimir la imagen de portada:', err);
        const reader = new FileReader();
        reader.onload = (ev) => setCoverImage(ev.target.result);
        reader.readAsDataURL(file);
      }
    }
  };

  // Reset Form
  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setCoverImage(null);
    setRawFile(null);
    setEditingId(null);
    setErrorMsg(null);
  };

  // Start Editing
  const startEdit = (item) => {
    setEditingId(item.id);
    setTitle(item.title);
    setSubtitle(item.subtitle || '');
    setCoverImage(item.image || item.cover || '/defecto.webp');
    setErrorMsg(null);
  };

  // Save / Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setErrorMsg('Por favor, ingresa un título para la historia destacada.');
      return;
    }

    let finalImage = coverImage;
    if (rawFile) {
      try {
        const compressed = await compressImage(rawFile, 800, 0.7);
        finalImage = await uploadImageToSupabase(rawFile || compressed);
      } catch (e) {
        console.error(e);
      }
    }

    if (!finalImage || finalImage.trim() === '') {
      finalImage = '/defecto.webp';
    }

    const editingItem = highlights.find((h) => h.id === editingId);
    const oldTitle = editingItem ? editingItem.title : null;

    const item = {
      id: editingId || undefined,
      title: title.trim(),
      subtitle: subtitle.trim() || 'Destacada',
      image: finalImage,
      cover: finalImage,
      isFeatured: editingId ? (editingItem?.isFeatured || false) : highlights.length === 0,
    };

    if (editingId) {
      await saveHighlightToCloud(item, oldTitle);
    } else {
      await createHighlight(item);
    }

    await loadData();

    setToastMsg(editingId ? '¡Historia destacada actualizada!' : '¡Nueva historia destacada creada!');
    resetForm();
    setTimeout(() => setToastMsg(null), 2000);
  };

  // Delete Highlight
  const handleDelete = async (id, highlightTitle) => {
    if (
      window.confirm(
        `¿Eliminar la historia "${highlightTitle}"? Sus fotos NO se borrarán de la Galería, únicamente se removerá la etiqueta de esta destacada.`
      )
    ) {
      await deleteHighlightFromCloud(id, highlightTitle);
      await loadData();
      if (editingId === id) resetForm();
      setToastMsg('¡Historia destacada eliminada!');
      setTimeout(() => setToastMsg(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1b4b]/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn select-none">
      <div className="silk-convex max-w-xl w-full rounded-3xl p-5 sm:p-8 relative max-h-[90dvh] overflow-y-auto no-scrollbar space-y-5 sm:space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Cerrar gestor"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full silk-convex text-[#1e1b4b] hover:text-[#4338ca] transition-colors cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Toast Feedback */}
        {toastMsg && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 silk-convex px-6 py-3 rounded-2xl flex items-center space-x-2 text-[#312e81] shadow-2xl border border-white/60 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-[#4338ca]" />
            <span className="font-semibold text-xs font-jakarta">{toastMsg}</span>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-1 pr-6">
          <span className="inline-flex items-center space-x-1 text-xs font-semibold text-[#4338ca] bg-[#4338ca]/10 px-3.5 py-1 rounded-full uppercase tracking-wider font-jakarta">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Historias Destacadas</span>
          </span>
          <h2 className="font-playfair italic text-2xl sm:text-3xl font-bold text-[#312e81] leading-tight break-words">
            Editor de Destacadas
          </h2>
          <p className="text-xs text-[#1e1b4b]/70 font-jakarta max-w-sm mx-auto leading-relaxed">
            Crea, edita o elimina historias. Al borrar una destacada, sus fotos permanecen seguras en la Galería.
          </p>
        </div>

        {/* Form (Create or Edit) */}
        <form onSubmit={handleSubmit} className="silk-concave rounded-2xl p-4 sm:p-5 space-y-4 border border-white/60 w-full">
          <div className="flex items-center justify-between">
            <h3 className="font-playfair italic text-lg font-bold text-[#312e81]">
              {editingId ? 'Editar Historia Destacada' : 'Crear Nueva Historia'}
            </h3>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="text-xs text-[#4338ca] font-semibold hover:underline font-jakarta cursor-pointer"
              >
                Cancelar edición
              </button>
            )}
          </div>

          {errorMsg && (
            <div className="text-xs text-red-600 font-semibold font-jakarta bg-red-500/10 p-2.5 rounded-xl border border-red-300">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center w-full">
            {/* Cover Image Picker */}
            <div className="sm:col-span-4 flex flex-col items-center space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <div
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden silk-convex p-1 cursor-pointer group relative border-2 border-white/60 shadow-md"
                title="Seleccionar portada"
              >
                <img
                  src={coverImage || '/defecto.webp'}
                  alt="Portada"
                  onError={(e) => {
                    e.target.src = '/defecto.webp';
                  }}
                  className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                  Cambiar
                </div>
              </div>
            </div>

            {/* Inputs */}
            <div className="sm:col-span-8 space-y-3 w-full">
              <div className="w-full">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#312e81] font-jakarta mb-1">
                  Título de la Destacada *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Escapadas, París, Aniversario..."
                  className="w-full px-3.5 py-2.5 rounded-xl silk-input font-jakarta text-base sm:text-sm"
                  required
                />
              </div>

              <div className="w-full">
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#312e81] font-jakarta mb-1">
                  Subtítulo / Descripción
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ej: Momentos mágicos juntos"
                  className="w-full px-3.5 py-2.5 rounded-xl silk-input font-jakarta text-base sm:text-sm"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl silk-button-primary font-bold text-base sm:text-sm font-jakarta flex items-center justify-center space-x-2 cursor-pointer shadow-md"
          >
            {editingId ? <Pencil className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{editingId ? 'Guardar Cambios' : 'Crear Historia Destacada'}</span>
          </button>
        </form>

        {/* Existing Highlights List */}
        <div className="space-y-3 pt-2 w-full">
          <h3 className="font-playfair italic text-lg font-bold text-[#312e81] px-1">
            Historias Actuales ({highlights.length})
          </h3>

          <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar pr-1 w-full">
            {highlights.map((item) => {
              const coverImage = item.cover || item.image || '/defecto.webp';
              return (
                <div
                  key={item.id}
                  className="silk-convex rounded-2xl p-3 flex items-center justify-between space-x-3 transition-all hover:scale-[1.005] w-full"
                >
                  <div className="flex items-center space-x-3 truncate">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full overflow-hidden p-0.5 silk-convex shrink-0 border border-white/60">
                      <img
                        src={coverImage}
                        alt={item.title}
                        onError={(e) => {
                          e.target.src = '/defecto.webp';
                        }}
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>

                  <div className="truncate">
                    <h4 className="font-playfair italic text-sm sm:text-base font-bold text-[#312e81] truncate">
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-[#1e1b4b]/70 font-jakarta truncate">
                      {item.subtitle || 'Destacada'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    className="p-2 rounded-xl silk-convex text-[#4338ca] hover:scale-110 transition-transform cursor-pointer"
                    title="Editar destacada"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-2 rounded-xl silk-convex text-red-600 hover:scale-110 transition-transform cursor-pointer"
                    title="Eliminar destacada"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
          </div>
        </div>

      </div>
    </div>
  );
}
