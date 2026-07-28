import React from 'react';
import { Home, Image as GalleryIcon, Upload, Settings } from 'lucide-react';

export default function BottomNavBar({ currentTab, onTabChange, isVisible = true }) {
  const navItems = [
    { id: 'home', label: 'Inicio', icon: Home },
    { id: 'gallery', label: 'Galería', icon: GalleryIcon },
    { id: 'upload', label: 'Subir', icon: Upload },
    { id: 'settings', label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav
      aria-label="Navegación principal"
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md transition-all duration-300 ease-in-out ${
        !isVisible
          ? 'pointer-events-none opacity-0 translate-y-full'
          : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="silk-convex rounded-3xl p-2 sm:p-2.5 flex items-center justify-around shadow-2xl backdrop-blur-md bg-[#e0e7ff]/90 border border-white/50">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center py-2 px-3 sm:px-4 rounded-2xl transition-all duration-300 font-jakarta select-none cursor-pointer ${
                isActive
                  ? 'silk-concave silk-convex-pressed neo-pressed text-[#4338ca] scale-95 font-bold shadow-inner'
                  : 'silk-convex text-[#1e1b4b]/70 hover:text-[#312e81] hover:scale-105 active:silk-convex-pressed'
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform duration-300 ${
                  isActive ? 'scale-110 text-[#4338ca]' : 'text-[#312e81]/80'
                }`}
              />
              <span className="text-[10px] sm:text-xs mt-1 tracking-wide">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
