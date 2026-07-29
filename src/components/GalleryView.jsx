import React, { useState, useEffect } from 'react';
import { Sparkles, Calendar, MapPin, Tag, X, Trash2, Image as ImageIcon, ImagePlus, CheckSquare, Check, Square } from 'lucide-react';
import { fetchHighlightsFromCloud } from '../utils/supabaseService';
import { fetchMemories, deleteMemoryFromCloud, batchDeleteMemoriesFromCloud } from '../utils/supabaseService';
import AssignHighlightsModal from './AssignHighlightsModal';

export default function GalleryView({ onNavigateToUpload, onModalStateChange }) {
  const [memories, setMemories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [categories, setCategories] = useState(['Todos']);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Selection Mode State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // Assignment Modal State
  const [assigningTargetMemories, setAssigningTargetMemories] = useState(null);

  useEffect(() => {
    if (onModalStateChange) {
      onModalStateChange(Boolean(selectedPhoto || assigningTargetMemories || isSelectionMode));
    }
    return () => {
      if (onModalStateChange) {
        onModalStateChange(false);
      }
    };
  }, [selectedPhoto, assigningTargetMemories, isSelectionMode, onModalStateChange]);

  // Load dynamic category filter tabs
  const loadCategories = async () => {
    const list = await fetchHighlightsFromCloud();
    const catTitles = list.map((h) => h.title);
    setCategories(['Todos', ...catTitles]);
  };

  // Helper to load memories from Supabase / cache
  const loadMemoriesData = async () => {
    const list = await fetchMemories();
    setMemories(list);
  };

  useEffect(() => {
    loadMemoriesData();
    loadCategories();

    const handleMemoryAdded = () => loadMemoriesData();
    const handleHighlightsUpdated = () => loadCategories();

    window.addEventListener('eternal_muse_memory_added', handleMemoryAdded);
    window.addEventListener('gorditos_highlights_updated', handleHighlightsUpdated);
    window.addEventListener('storage', handleMemoryAdded);

    return () => {
      window.removeEventListener('eternal_muse_memory_added', handleMemoryAdded);
      window.removeEventListener('gorditos_highlights_updated', handleHighlightsUpdated);
      window.removeEventListener('storage', handleMemoryAdded);
    };
  }, []);

  // Filter memories by category
  const filteredMemories =
    selectedCategory === 'Todos'
      ? memories
      : memories.filter((m) => {
          const itemCats = Array.isArray(m.categories)
            ? m.categories
            : m.category
            ? [m.category]
            : [];
          return itemCats.some(
            (c) => c.toLowerCase() === selectedCategory.toLowerCase()
          );
        });

  // Toggle selection mode
  const toggleSelectionMode = () => {
    if (isSelectionMode) {
      setIsSelectionMode(false);
      setSelectedIds([]);
    } else {
      setIsSelectionMode(true);
    }
  };

  // Toggle single card selection
  const toggleSelectCard = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Select / Deselect All
  const handleSelectAll = () => {
    if (selectedIds.length === filteredMemories.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredMemories.map((m) => m.id));
    }
  };

  // Card click handler: sets selectedPhoto for gallery lightbox preview
  const handleCardClick = (item) => {
    if (isSelectionMode) {
      toggleSelectCard(item.id);
    } else {
      setSelectedPhoto(item);
    }
  };

  // Single memory deletion (cloud + local)
  const handleDeleteMemory = async (id) => {
    try {
      setSelectedPhoto(null);
      await deleteMemoryFromCloud(id);
      await loadMemoriesData();
    } catch (e) {
      console.error('Error al eliminar recuerdo:', e);
    }
  };

  // Batch deletion logic (cloud + local)
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;

    if (
      window.confirm(
        `¿Estás seguro de que deseas eliminar definitivamente ${selectedIds.length} ${
          selectedIds.length === 1 ? 'recuerdo' : 'recuerdos'
        }?`
      )
    ) {
      try {
        await batchDeleteMemoriesFromCloud(selectedIds);
        setSelectedIds([]);
        setIsSelectionMode(false);
        await loadMemoriesData();
      } catch (e) {
        console.error('Error al eliminar recuerdos en lote:', e);
      }
    }
  };

  return (
    <div className="w-full space-y-8 animate-fadeIn pb-12 relative">
      {/* Assign Highlights Modal */}
      {assigningTargetMemories && (
        <AssignHighlightsModal
          targetMemories={assigningTargetMemories}
          onClose={() => setAssigningTargetMemories(null)}
          onSaveSuccess={() => {
            loadMemoriesData();
            setIsSelectionMode(false);
            setSelectedIds([]);
          }}
        />
      )}

      {/* Header & Selection Mode Toggle Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left space-y-1">
          <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-bold text-[#4338ca] bg-[#4338ca]/10 uppercase tracking-wider font-jakarta">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Galería de Momentos</span>
          </span>
          <h2 className="font-playfair italic text-3xl sm:text-4xl font-bold text-[#312e81]">
            Nuestra Colección
          </h2>
        </div>

        {/* Selection Mode Button */}
        {memories.length > 0 && (
          <button
            onClick={toggleSelectionMode}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold font-jakarta transition-all duration-200 select-none cursor-pointer flex items-center space-x-2 ${
              isSelectionMode
                ? 'silk-concave text-[#4338ca] font-bold shadow-inner'
                : 'silk-convex text-[#312e81] hover:scale-105'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-[#4338ca]" />
            <span>{isSelectionMode ? 'Cancelar Selección' : 'Seleccionar'}</span>
          </button>
        )}
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center justify-start sm:justify-center space-x-2 sm:space-x-3 overflow-x-auto no-scrollbar py-2 px-1">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap select-none font-jakarta cursor-pointer ${
                isActive
                  ? 'silk-concave text-[#4338ca] font-bold scale-95 shadow-inner'
                  : 'silk-convex text-[#1e1b4b]/70 hover:text-[#312e81] hover:scale-105'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Gallery Grid */}
      {filteredMemories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {filteredMemories.map((item) => {
            const memoryCats = Array.isArray(item.categories)
              ? item.categories
              : item.category
              ? [item.category]
              : [];

            const isSelected = selectedIds.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => handleCardClick(item)}
                className={`silk-convex rounded-3xl p-4 cursor-pointer group transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between relative ${
                  isSelected ? 'ring-2 ring-[#4338ca] silk-concave' : ''
                }`}
              >
                {/* Selection Circle Checkbox */}
                {isSelectionMode && (
                  <div className="absolute top-6 left-6 z-20">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isSelected
                          ? 'bg-[#4338ca] text-white shadow-md scale-110'
                          : 'bg-[#e0e7ff]/90 backdrop-blur-md text-transparent border-2 border-[#4338ca]/40'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {/* Image Container */}
                  <div className="h-56 sm:h-60 rounded-2xl overflow-hidden relative shadow-inner">
                    <img
                      src={item.image}
                      alt={item.title}
                      className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                        isSelected ? 'brightness-90' : ''
                      }`}
                    />
                    <div className="absolute top-3 right-3 flex flex-wrap justify-end gap-1 max-w-[80%]">
                      {memoryCats.length > 0 ? (
                        memoryCats.slice(0, 2).map((cat, idx) => (
                          <span
                            key={idx}
                            className="bg-[#e0e7ff]/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-[#4338ca] silk-convex uppercase tracking-wider truncate"
                          >
                            {cat}
                          </span>
                        ))
                      ) : (
                        <span className="bg-[#e0e7ff]/80 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-[#1e1b4b]/60 italic">
                          Sin destacada
                        </span>
                      )}
                      {memoryCats.length > 2 && (
                        <span className="bg-[#4338ca] text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                          +{memoryCats.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Info */}
                  <div className="space-y-1.5 px-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-playfair italic text-xl font-bold text-[#312e81] line-clamp-1 group-hover:text-[#4338ca] transition-colors flex-1">
                        {item.title}
                      </h3>

                      {/* Tag Assignment Button on Card */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAssigningTargetMemories([item]);
                        }}
                        className="p-1.5 rounded-xl silk-convex text-[#4338ca] hover:scale-110 transition-transform ml-2 shrink-0 cursor-pointer"
                        title="Asignar a Historias Destacadas"
                      >
                        <Tag className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#1e1b4b]/70 font-jakarta pt-1">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5 text-[#4338ca]" />
                        <span>{item.date}</span>
                      </span>

                      {item.location && (
                        <span className="flex items-center space-x-1 truncate max-w-[140px]">
                          <MapPin className="w-3.5 h-3.5 text-[#4338ca]" />
                          <span className="truncate">{item.location}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="silk-convex rounded-3xl p-8 sm:p-12 text-center space-y-4 max-w-md mx-auto my-6">
          <div className="p-4 rounded-full silk-convex text-[#4338ca] w-16 h-16 mx-auto flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-[#4338ca]" />
          </div>
          <div className="space-y-1">
            <h3 className="font-playfair italic text-2xl font-bold text-[#312e81]">
              Aún no hay recuerdos guardados
            </h3>
            <p className="text-xs sm:text-sm text-[#1e1b4b]/70 font-jakarta leading-relaxed">
              {selectedCategory === 'Todos'
                ? '¡Sube tu primer momento para comenzar a construir vuestra historia!'
                : `No hay fotos asignadas a la categoría "${selectedCategory}".`}
            </p>
          </div>

          {onNavigateToUpload && (
            <button
              onClick={onNavigateToUpload}
              className="silk-button-primary py-3 px-6 rounded-2xl text-xs sm:text-sm font-bold font-jakarta inline-flex items-center space-x-2 cursor-pointer"
            >
              <ImagePlus className="w-4 h-4" />
              <span>Subir Primer Recuerdo</span>
            </button>
          )}
        </div>
      )}

      {/* FLOATING ACTION BAR FOR MULTIPLE SELECTION */}
      {isSelectionMode && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] animate-fadeIn pointer-events-none">
          <div className="silk-convex rounded-3xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 w-full max-w-md mx-auto shadow-2xl backdrop-blur-md bg-[#e0e7ff]/95 border border-white/60 pointer-events-auto">
            <div className="flex items-center space-x-1.5 text-[#312e81] font-semibold text-xs sm:text-sm font-jakarta px-1">
              <CheckSquare className="w-4 h-4 text-[#4338ca]" />
              <span>
                {selectedIds.length} {selectedIds.length === 1 ? 'seleccionada' : 'seleccionadas'}
              </span>
            </div>

            <div className="flex items-center justify-center sm:justify-end gap-2 w-full sm:w-auto flex-wrap sm:flex-nowrap">
              <button
                type="button"
                onClick={handleSelectAll}
                className="neo-button px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#312e81]"
              >
                {selectedIds.length === filteredMemories.length ? 'Desmarcar' : 'Todas'}
              </button>

              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={() => {
                  const targets = memories.filter((m) => selectedIds.includes(m.id));
                  setAssigningTargetMemories(targets);
                }}
                className="silk-convex px-3 py-1.5 rounded-xl font-bold text-xs text-[#4338ca] hover:scale-105 transition-all flex items-center space-x-1 cursor-pointer disabled:opacity-40"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Asignar</span>
              </button>

              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={handleBatchDelete}
                className="silk-button-primary px-3 py-1.5 rounded-xl font-bold text-xs font-jakarta flex items-center space-x-1 disabled:opacity-40 cursor-pointer shadow-md bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar seleccionadas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Lightbox Preview Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setSelectedPhoto(null)}
        >
          {/* Close button 'X' top right */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedPhoto(null);
            }}
            aria-label="Cerrar modal"
            className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all cursor-pointer z-10 backdrop-blur-md"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Centered Content Container */}
          <div
            className="relative max-w-4xl w-full flex flex-col items-center justify-center space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Centered Image respecting size and resolution */}
            <img
              src={selectedPhoto.image}
              alt={selectedPhoto.title || 'Foto de la galería'}
              className="max-h-[85vh] max-w-full object-contain rounded-2xl shadow-2xl"
            />

            {/* Bottom Info Bar: Title / Description and Date */}
            {(selectedPhoto.title || selectedPhoto.date || selectedPhoto.description || selectedPhoto.location) && (
              <div className="w-full max-w-2xl bg-black/60 backdrop-blur-md border border-white/15 rounded-2xl p-4 text-white space-y-2 text-center sm:text-left shadow-2xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    {selectedPhoto.title && (
                      <h3 className="font-playfair italic text-xl sm:text-2xl font-bold text-white">
                        {selectedPhoto.title}
                      </h3>
                    )}
                    {selectedPhoto.description && (
                      <p className="text-xs sm:text-sm text-white/80 font-jakarta">
                        {selectedPhoto.description}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-white/80 font-jakarta shrink-0">
                    {selectedPhoto.date && (
                      <span className="flex items-center space-x-1 bg-white/10 px-2.5 py-1 rounded-full">
                        <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                        <span>{selectedPhoto.date}</span>
                      </span>
                    )}
                    {selectedPhoto.location && (
                      <span className="flex items-center space-x-1 bg-white/10 px-2.5 py-1 rounded-full">
                        <MapPin className="w-3.5 h-3.5 text-indigo-300" />
                        <span>{selectedPhoto.location}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions: Delete & Tag */}
                <div className="pt-2 flex items-center justify-between border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => handleDeleteMemory(selectedPhoto.id)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/20 transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Recuerdo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const target = selectedPhoto;
                      setSelectedPhoto(null);
                      setAssigningTargetMemories([target]);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white hover:bg-white/10 transition-all flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5" />
                    <span>Destacar</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
