import React, { useState } from 'react';
import { Heart, CloudOff, Info, X } from 'lucide-react';
import { isSupabaseConfigured } from '../lib/supabaseClient';

export default function Header() {
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [showNotice, setShowNotice] = useState(true);

  const handleHeartClick = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#e0e7ff]/90 border-b border-indigo-200/50 transition-all duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
        {/* Brand Title */}
        <div className="flex items-center space-x-2 select-none">
          <h1 className="font-playfair italic text-2xl sm:text-3xl font-bold tracking-tight text-[#312e81]">
            Gorditos
          </h1>
          <span className="inline-block w-2 h-2 rounded-full bg-[#4338ca] animate-pulse"></span>
        </div>

        {/* Status indicator & Neumorphic Heart Button */}
        <div className="flex items-center space-x-3">
          {isSupabaseConfigured ? (
            <span className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-700 bg-emerald-500/10 border border-emerald-500/20 uppercase tracking-wider font-jakarta">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Supabase Conectado</span>
            </span>
          ) : (
            <span className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold text-amber-700 bg-amber-500/10 border border-amber-500/20 uppercase tracking-wider font-jakarta" title="Añade las variables VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en .env.local para sincronización en tiempo real">
              <CloudOff className="w-3 h-3 text-amber-600" />
              <span>Modo Offline (Local)</span>
            </span>
          )}

          <button
            onClick={handleHeartClick}
            aria-label="Guardar recuerdo o dar me gusta"
            className={`group flex items-center space-x-2 px-3.5 py-2 rounded-full transition-all duration-300 cursor-pointer ${
              isLiked
                ? 'silk-concave text-[#4338ca]'
                : 'silk-convex hover:scale-105 text-[#312e81]'
            }`}
          >
            <Heart
              className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                isLiked ? 'fill-[#4338ca] text-[#4338ca]' : 'text-[#312e81]'
              }`}
            />
            {likes > 0 && (
              <span className="text-xs font-semibold font-jakarta px-1.5 py-0.5 rounded-full bg-[#312e81]/10">
                {likes}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Configuration Notice Banner if Supabase env vars are missing */}
      {!isSupabaseConfigured && showNotice && (
        <div className="bg-[#312e81] text-white px-4 py-2 text-xs font-jakarta flex items-center justify-between border-t border-indigo-700/50 animate-fadeIn">
          <div className="flex items-center space-x-2 max-w-4xl mx-auto truncate">
            <Info className="w-4 h-4 text-[#818cf8] shrink-0" />
            <span className="truncate">
              <strong>Sincronización Nube Supabase:</strong> Para sincronización en tiempo real entre múltiples móviles, añade <code className="bg-indigo-900/60 px-1 py-0.5 rounded text-indigo-200">VITE_SUPABASE_URL</code> y <code className="bg-indigo-900/60 px-1 py-0.5 rounded text-indigo-200">VITE_SUPABASE_ANON_KEY</code> en tu archivo <code className="text-amber-300 font-mono">.env.local</code>.
            </span>
          </div>
          <button
            onClick={() => setShowNotice(false)}
            aria-label="Cerrar aviso"
            className="p-1 rounded hover:bg-white/10 text-white/80 hover:text-white transition-colors shrink-0 ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </header>
  );
}
