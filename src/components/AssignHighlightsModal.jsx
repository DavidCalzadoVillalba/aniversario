import React, { useState, useEffect } from 'react';
import { X, Tag, Check, Save, CheckCircle2 } from 'lucide-react';
import { fetchHighlightsFromCloud, updateMemoryCategoriesInCloud } from '../utils/supabaseService';

export default function AssignHighlightsModal({ targetMemories = [], onClose, onSaveSuccess }) {
  const [highlights, setHighlights] = useState([]);
  const [selectedCategoryTitles, setSelectedCategoryTitles] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      const list = await fetchHighlightsFromCloud();
      setHighlights(list);

      // Initial check state calculation
      if (targetMemories.length === 1) {
        const memory = targetMemories[0];
        const existingCats = Array.isArray(memory.categories)
          ? memory.categories
          : memory.category
          ? [memory.category]
          : [];
        setSelectedCategoryTitles(existingCats);
      } else if (targetMemories.length > 1) {
        const firstCats = Array.isArray(targetMemories[0].categories)
          ? targetMemories[0].categories
          : [];
        const common = firstCats.filter((cat) =>
          targetMemories.every((m) => {
            const cats = Array.isArray(m.categories) ? m.categories : [];
            return cats.includes(cat);
          })
        );
        setSelectedCategoryTitles(common);
      }
    };
    loadData();
  }, [targetMemories]);

  // Toggle single highlight title
  const toggleHighlight = (title) => {
    if (selectedCategoryTitles.includes(title)) {
      setSelectedCategoryTitles(selectedCategoryTitles.filter((t) => t !== title));
    } else {
      setSelectedCategoryTitles([...selectedCategoryTitles, title]);
    }
  };

  // Save changes to cloud & local storage
  const handleSave = async () => {
    try {
      const targetIds = targetMemories.map((m) => m.id);
      await updateMemoryCategoriesInCloud(targetIds, selectedCategoryTitles);

      setToastMsg('¡Historias destacadas actualizadas!');
      setTimeout(() => {
        if (onSaveSuccess) onSaveSuccess();
        onClose();
      }, 1000);
    } catch (e) {
      console.error('Error al actualizar historias:', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1e1b4b]/60 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn select-none">
      <div className="silk-convex max-w-md w-full rounded-3xl p-5 sm:p-8 relative space-y-5 sm:space-y-6 max-h-[90dvh] overflow-y-auto no-scrollbar">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Cerrar modal"
          className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full silk-convex text-[#1e1b4b] hover:text-[#4338ca] transition-colors cursor-pointer"
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
            <Tag className="w-3.5 h-3.5" />
            <span>Asignación de Historias</span>
          </span>
          <h3 className="font-playfair italic text-2xl font-bold text-[#312e81]">
            Vincular a Destacadas
          </h3>
          <p className="text-xs text-[#1e1b4b]/70 font-jakarta leading-relaxed">
            {targetMemories.length === 1
              ? `Selecciona a qué historias destacadas pertenece "${targetMemories[0]?.title}".`
              : `Selecciona las historias destacadas para las ${targetMemories.length} fotos seleccionadas.`}
          </p>
        </div>

        {/* Highlights List with Checkboxes */}
        <div className="space-y-3 pt-1 w-full">
          {highlights.length > 0 ? (
            <div className="space-y-2.5 max-h-56 overflow-y-auto no-scrollbar pr-1 w-full">
              {highlights.map((item) => {
                const isChecked = selectedCategoryTitles.includes(item.title);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleHighlight(item.title)}
                    className={`silk-convex rounded-2xl p-3 flex items-center justify-between space-x-3 cursor-pointer transition-all duration-200 w-full ${
                      isChecked ? 'ring-2 ring-[#4338ca] silk-concave' : 'hover:scale-[1.01]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden p-0.5 silk-convex shrink-0 border border-white/60">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-full"
                        />
                      </div>
                      <div className="truncate">
                        <h4 className="font-playfair italic text-sm sm:text-base font-bold text-[#312e81] truncate">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-[#1e1b4b]/70 font-jakarta truncate">
                          {item.subtitle || 'Historia Destacada'}
                        </p>
                      </div>
                    </div>

                    {/* Checkbox Icon */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all shrink-0 ${
                        isChecked
                          ? 'bg-[#4338ca] text-white shadow-md'
                          : 'bg-[#e0e7ff] text-transparent border border-[#312e81]/30'
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-center text-[#1e1b4b]/60 font-jakarta py-4">
              No hay historias destacadas creadas aún. Puedes crearlas en los Ajustes o Inicio.
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-2 flex items-center space-x-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="neo-button flex-1 py-3 rounded-2xl font-semibold text-xs sm:text-sm text-[#312e81] cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="silk-button-primary flex-1 py-3 rounded-2xl font-bold text-xs sm:text-sm font-jakarta flex items-center justify-center space-x-1.5 shadow-md cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Asignación</span>
          </button>
        </div>

      </div>
    </div>
  );
}
