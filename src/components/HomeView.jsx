import React, { useState, useEffect } from 'react';
import { Sparkles, MapPin, Calendar, Heart, ArrowRight, Compass, Plus, Pencil } from 'lucide-react';
import { fetchHighlightsFromCloud } from '../utils/supabaseService';

export default function HomeView({ onSelectStory, onNavigateToGallery, onOpenHighlightEditor }) {
  const [activeCard, setActiveCard] = useState(null);
  const [stories, setStories] = useState([]);

  const loadStoriesData = async () => {
    const list = await fetchHighlightsFromCloud();
    setStories(list);
  };

  useEffect(() => {
    loadStoriesData();

    const handleHighlightsUpdated = () => loadStoriesData();
    window.addEventListener('gorditos_highlights_updated', handleHighlightsUpdated);
    window.addEventListener('storage', handleHighlightsUpdated);

    return () => {
      window.removeEventListener('gorditos_highlights_updated', handleHighlightsUpdated);
      window.removeEventListener('storage', handleHighlightsUpdated);
    };
  }, []);

  const handleCardClick = (cardId) => {
    setActiveCard(cardId);
    setTimeout(() => setActiveCard(null), 300);
  };

  return (
    <div className="w-full space-y-8 animate-fadeIn">
      {/* 1. SECCIÓN DE HISTORIAS (HERO TOP) */}
      <section aria-label="Historias destacadas" className="w-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <h2 className="font-playfair italic text-xl sm:text-2xl font-bold text-[#312e81]">
              Historias Especiales
            </h2>
            <button
              onClick={() => onOpenHighlightEditor && onOpenHighlightEditor()}
              className="p-1.5 rounded-full silk-convex text-[#4338ca] hover:scale-110 transition-transform cursor-pointer"
              title="Gestionar historias destacadas"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => onOpenHighlightEditor && onOpenHighlightEditor()}
            className="text-xs font-semibold text-[#4338ca] hover:underline font-jakarta flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Editar Destacadas</span>
          </button>
        </div>

        {/* Scroll Horizontal Limpio sin barra de desplazamiento */}
        <div className="flex items-center space-x-5 overflow-x-auto no-scrollbar py-3 px-1">
          {stories.map((story) => (
            <button
              key={story.id}
              onClick={() => onSelectStory && onSelectStory(story)}
              className="flex flex-col items-center space-y-2 group shrink-0 focus:outline-none cursor-pointer"
            >
              {/* Contenedor del Avatar con borde neumórfico */}
              <div
                className={`relative p-1 rounded-full transition-all duration-300 group-hover:scale-105 ${
                  story.isFeatured
                    ? 'p-[3px] bg-gradient-to-tr from-[#312e81] via-[#4338ca] to-[#818cf8] shadow-lg animate-pulse'
                    : 'silk-convex'
                }`}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden p-0.5 bg-[#e0e7ff] border-2 border-white/60">
                  <img
                    src={story.image || '/images/defecto.webp'}
                    alt={story.title}
                    onError={(e) => {
                      e.currentTarget.src = '/images/defecto.webp';
                    }}
                    className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                {story.isFeatured && (
                  <span className="absolute -bottom-1 -right-1 bg-[#4338ca] text-white p-1 rounded-full shadow-md">
                    <Sparkles className="w-3 h-3 animate-spin" style={{ animationDuration: '4s' }} />
                  </span>
                )}
              </div>

              {/* Título de la Historia */}
              <span className="text-xs sm:text-sm font-medium text-[#1e1b4b] group-hover:text-[#4338ca] transition-colors font-jakarta tracking-tight">
                {story.title}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 2. CUADRÍCULA DE CATEGORÍAS (CATEGORY GRID) */}
      <section aria-label="Cuadrícula de recuerdos" className="w-full">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
          
          {/* TARJETA DE VIAJES (GRANDE) - md:col-span-8 */}
          <div
            onClick={() => {
              handleCardClick('travel');
              if (onSelectStory) onSelectStory({ title: 'Viajes', category: 'Viajes' });
            }}
            className={`md:col-span-8 rounded-3xl overflow-hidden relative group cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
              activeCard === 'travel' ? 'silk-concave neo-pressed' : 'silk-convex neo-extruded'
            }`}
          >
            <div className="h-72 sm:h-80 md:h-96 w-full relative overflow-hidden">
              <img
                src="/images/viajes.webp"
                alt="Sección Viajes"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b4b]/90 via-[#1e1b4b]/40 to-transparent flex flex-col justify-end p-6 sm:p-8">
                <div className="flex items-center space-x-2 text-indigo-200 text-xs sm:text-sm font-semibold uppercase tracking-widest mb-2 font-jakarta">
                  <Compass className="w-4 h-4 text-[#818cf8]" />
                  <span>Aventuras Juntos</span>
                </div>
                <h3 className="font-playfair italic text-3xl sm:text-4xl font-bold text-white mb-2">
                  VIAJES
                </h3>
                <p className="text-indigo-100/90 text-sm sm:text-base max-w-lg font-jakarta">
                  Descubre los destinos inolvidables que hemos recorrido mano a mano.
                </p>
              </div>
            </div>
          </div>

          {/* TARJETA DE MOMENTOS DESTACADOS - md:col-span-4 */}
          <div
            onClick={() => {
              handleCardClick('highlights');
              if (onSelectStory) onSelectStory({ title: 'Momentos', category: 'Momentos' });
            }}
            className={`md:col-span-4 rounded-3xl p-5 sm:p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
              activeCard === 'highlights' ? 'silk-concave neo-pressed' : 'silk-convex neo-extruded'
            }`}
          >
            <div className="space-y-4">
              <div className="h-44 sm:h-48 rounded-2xl overflow-hidden relative shadow-inner">
                <img
                  src="/images/momentospuros.webp"
                  alt="Momentos Destacados"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 right-3 bg-[#e0e7ff]/80 backdrop-blur-md p-2 rounded-full text-[#4338ca] silk-convex">
                  <Heart className="w-4 h-4 fill-[#4338ca]" />
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-semibold text-[#4338ca] uppercase tracking-wider font-jakarta">
                  Destacados
                </span>
                <h3 className="font-playfair italic text-2xl font-bold text-[#312e81]">
                  Momentos Puros
                </h3>
              </div>

              <p className="text-sm text-[#1e1b4b]/80 leading-relaxed font-jakarta">
                "Fragmentos de felicidad pura guardados para siempre."
              </p>
            </div>

            <div className="pt-4 flex items-center justify-between text-xs font-semibold text-[#312e81]">
              <span>Colección Especial</span>
              <ArrowRight className="w-4 h-4 text-[#4338ca] group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* TARJETA DE CITAS ("LA CHISPA ETERNA") - md:col-span-12 */}
          <div
            onClick={() => {
              handleCardClick('sparks');
              if (onNavigateToGallery) onNavigateToGallery();
            }}
            className={`md:col-span-12 rounded-3xl overflow-hidden relative group cursor-pointer transition-all duration-300 hover:scale-[1.01] ${
              activeCard === 'sparks' ? 'silk-concave neo-pressed' : 'silk-convex neo-extruded'
            }`}
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 sm:p-8">
              {/* Text & Content */}
              <div className="md:col-span-7 space-y-3">
                <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-bold text-[#4338ca] bg-[#4338ca]/10 tracking-wider uppercase font-jakarta">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>LA CHISPA ETERNA</span>
                </span>

                <h3 className="font-playfair italic text-2xl sm:text-3xl md:text-4xl font-bold text-[#312e81]">
                  Nuestras Citas & Recuerdos Inolvidables
                </h3>

                <p className="text-sm sm:text-base text-[#1e1b4b]/80 leading-relaxed max-w-2xl font-jakarta">
                  Cada mirada, cada risa compartida y cada pequeño gesto que encendió la llama de nuestra historia de amor.
                </p>

                <div className="pt-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onNavigateToGallery) onNavigateToGallery();
                    }}
                    className="neo-button silk-convex px-6 py-3 rounded-2xl flex items-center space-x-3 text-[#312e81] font-semibold text-sm sm:text-base hover:text-[#4338ca] transition-all group font-jakarta cursor-pointer"
                  >
                    <span>Explorar Galería</span>
                    <ArrowRight className="w-4 h-4 text-[#4338ca] group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>

              {/* Side Preview Image Container with nuestrasCitas.webp */}
              <div className="md:col-span-5 h-48 sm:h-56 md:h-64 rounded-2xl overflow-hidden relative shadow-inner silk-convex border border-white/60">
                <img
                  src="/images/nuestrasCitas.webp"
                  alt="Nuestras Citas y Recuerdos"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#312e81]/40 via-transparent to-transparent"></div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
