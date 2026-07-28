import React, { useState, useEffect } from 'react';
import { Calendar, Heart, Shield, RefreshCw, Sparkles, CheckCircle2, Pencil } from 'lucide-react';
import { INITIAL_MOCK_MEMORIES, STORAGE_KEY } from '../utils/initialMemories';

export default function SettingsView({ onOpenHighlightEditor }) {
  const [anniversaryDate, setAnniversaryDate] = useState('2024-05-18');
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    const savedDate = localStorage.getItem('eternal_muse_anniversary');
    if (savedDate) {
      setAnniversaryDate(savedDate);
    }
  }, []);

  const handleSaveDate = (e) => {
    e.preventDefault();
    localStorage.setItem('eternal_muse_anniversary', anniversaryDate);
    setToastMsg('¡Fecha de aniversario actualizada!');
    setTimeout(() => setToastMsg(null), 2000);
  };

  const handleResetData = () => {
    if (window.confirm('¿Deseas restaurar el estado inicial? Esto borrará tus recuerdos locales.')) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_MOCK_MEMORIES));
      window.dispatchEvent(new CustomEvent('eternal_muse_memory_added'));
      setToastMsg('¡Recuerdos vaciados con éxito!');
      setTimeout(() => setToastMsg(null), 2000);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fadeIn pb-8">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 silk-convex px-6 py-3.5 rounded-2xl flex items-center space-x-3 text-[#312e81] shadow-2xl border border-white/60 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#4338ca]" />
          <span className="font-semibold text-sm font-jakarta">{toastMsg}</span>
        </div>
      )}

      {/* Title */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-bold text-[#4338ca] bg-[#4338ca]/10 uppercase tracking-wider font-jakarta">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Personalización</span>
        </span>
        <h2 className="font-playfair italic text-3xl sm:text-4xl font-bold text-[#312e81]">
          Ajustes de Gorditos
        </h2>
        <p className="text-sm text-[#1e1b4b]/70 font-jakarta max-w-md mx-auto">
          Configura vuestra fecha especial y gestiona las historias destacadas del sistema.
        </p>
      </div>

      {/* Settings Options Grid */}
      <div className="space-y-6">
        
        {/* Gestor de Historias Destacadas */}
        <div className="silk-convex rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center space-x-3 text-[#312e81]">
            <div className="p-3 rounded-2xl silk-convex text-[#4338ca]">
              <Pencil className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-playfair italic text-xl font-bold">Historias Destacadas</h3>
              <p className="text-xs text-[#1e1b4b]/70 font-jakarta">
                Añade, edita o elimina las categorías e historias del carrusel y filtros.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onOpenHighlightEditor && onOpenHighlightEditor()}
            className="silk-button-primary px-6 py-3 rounded-2xl font-bold text-sm font-jakarta flex items-center space-x-2 shadow-md cursor-pointer"
          >
            <Pencil className="w-4 h-4" />
            <span>Gestionar Historias Destacadas</span>
          </button>
        </div>

        {/* Fecha de Aniversario */}
        <form onSubmit={handleSaveDate} className="silk-convex rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center space-x-3 text-[#312e81]">
            <div className="p-3 rounded-2xl silk-convex text-[#4338ca]">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-playfair italic text-xl font-bold">Fecha de Aniversario</h3>
              <p className="text-xs text-[#1e1b4b]/70 font-jakarta">
                Fecha del inicio de vuestra historia de amor.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
            <input
              type="date"
              value={anniversaryDate}
              onChange={(e) => setAnniversaryDate(e.target.value)}
              className="w-full sm:flex-1 px-4 py-3 rounded-2xl silk-input font-jakarta text-sm sm:text-base text-[#1e1b4b]"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 rounded-2xl silk-button-primary font-bold text-sm font-jakarta flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-white" />
              <span>Guardar Fecha</span>
            </button>
          </div>
        </form>

        {/* Limpieza de Datos */}
        <div className="silk-convex rounded-3xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center space-x-3 text-[#312e81]">
            <div className="p-3 rounded-2xl silk-convex text-[#4338ca]">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-playfair italic text-xl font-bold">Gestión del Almacenamiento</h3>
              <p className="text-xs text-[#1e1b4b]/70 font-jakarta">
                Limpia el almacenamiento local si deseas reiniciar vuestros recuerdos.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleResetData}
            className="neo-button px-6 py-3 rounded-2xl font-bold text-sm text-[#312e81] flex items-center space-x-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4 text-[#4338ca]" />
            <span>Vaciar Todos los Recuerdos</span>
          </button>
        </div>

        {/* Info del Sistema */}
        <div className="silk-convex rounded-3xl p-6 text-center space-y-2">
          <Shield className="w-6 h-6 text-[#4338ca] mx-auto" />
          <h4 className="font-playfair italic text-lg font-bold text-[#312e81]">Gorditos v1.0</h4>
          <p className="text-xs text-[#1e1b4b]/70 font-jakarta">
            Diseño Neumórfico 'Silk System' • Todos vuestros datos permanecen privados en el dispositivo.
          </p>
        </div>
      </div>
    </div>
  );
}
