import React, { useState, useEffect } from 'react';
import Header from './Header';
import BottomNavBar from './BottomNavBar';
import HomeView from './HomeView';
import GalleryView from './GalleryView';
import UploadView from './UploadView';
import SettingsView from './SettingsView';
import StoryViewer from './StoryViewer';
import HighlightsManagerModal from './HighlightsManagerModal';
import { fetchMemories, subscribeToRealtimeSync } from '../utils/supabaseService';
import { supabase } from '../lib/supabaseClient';
import { Heart } from 'lucide-react';

export default function MainLayout() {
  // State for active tab: 'home' | 'gallery' | 'upload' | 'settings'
  const [currentTab, setCurrentTab] = useState('home');

  // Unified States for full-screen Viewers / Modals to control bottom nav visibility
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [isHighlightEditorOpen, setIsHighlightEditorOpen] = useState(false);
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [allMemories, setAllMemories] = useState([]);

  // Load memories asynchronously (Supabase with localStorage fallback)
  const loadMemoriesData = async () => {
    const memories = await fetchMemories();
    setAllMemories(memories);
  };

  useEffect(() => {
    loadMemoriesData();

    const handleMemoryAdded = () => loadMemoriesData();
    window.addEventListener('eternal_muse_memory_added', handleMemoryAdded);
    window.addEventListener('storage', handleMemoryAdded);

    // Subscribe to Supabase Realtime channel
    const channel = subscribeToRealtimeSync(
      () => loadMemoriesData(),
      () => {
        loadMemoriesData();
        window.dispatchEvent(new CustomEvent('gorditos_highlights_updated'));
      }
    );

    return () => {
      window.removeEventListener('eternal_muse_memory_added', handleMemoryAdded);
      window.removeEventListener('storage', handleMemoryAdded);
      if (channel && supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleSelectStoryOrMemory = (storyOrMemory) => {
    setSelectedMemory(storyOrMemory);
  };

  const handleCloseViewer = () => {
    setSelectedMemory(null);
  };

  const isStoryOpen = selectedMemory !== null;

  // Unified decision to hide bottom nav
  const shouldHideNav = isStoryOpen || isGalleryModalOpen || isHighlightEditorOpen;

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#e0e7ff] text-[#1e1b4b] flex flex-col font-jakarta relative selection:bg-[#4338ca] selection:text-white overflow-x-hidden">
      {/* Sticky Header */}
      <Header />

      {/* Main Content Viewport with smooth transitions & mobile fluid padding */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 md:px-8 pt-4 pb-28 overflow-x-hidden">
        <div className="transition-opacity duration-300 animate-fadeIn w-full">
          {currentTab === 'home' && (
            <HomeView
              onSelectStory={handleSelectStoryOrMemory}
              onNavigateToGallery={() => setCurrentTab('gallery')}
              onOpenHighlightEditor={() => setIsHighlightEditorOpen(true)}
            />
          )}

          {currentTab === 'gallery' && (
            <GalleryView
              onSelectMemory={handleSelectStoryOrMemory}
              onNavigateToUpload={() => setCurrentTab('upload')}
              onModalStateChange={(isOpen) => setIsGalleryModalOpen(isOpen)}
            />
          )}

          {currentTab === 'upload' && (
            <UploadView
              onNavigateToGallery={() => setCurrentTab('gallery')}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              onOpenHighlightEditor={() => setIsHighlightEditorOpen(true)}
            />
          )}
        </div>

        {/* Branding Romantic Footer */}
        <footer className="mt-12 mb-4 pt-8 border-t border-indigo-200/60 text-center space-y-3 select-none">
          <div className="flex items-center justify-center space-x-2">
            <span className="w-8 h-[1px] bg-[#4338ca]/30"></span>
            <Heart className="w-4 h-4 text-[#4338ca] fill-[#4338ca]/30 animate-pulse" />
            <span className="w-8 h-[1px] bg-[#4338ca]/30"></span>
          </div>

          {/* Frase emotiva en Playfair Display Itálica */}
          <p className="font-playfair italic text-2xl sm:text-3xl md:text-4xl text-[#312e81] tracking-tight font-semibold leading-snug break-words">
            "Por todas las flores del dia para mi niña"
          </p>

          <p className="text-xs sm:text-sm text-[#1e1b4b]/60 font-jakarta">
            Gorditos
          </p>
        </footer>
      </main>

      {/* Highlights Manager Modal */}
      {isHighlightEditorOpen && (
        <HighlightsManagerModal
          onClose={() => setIsHighlightEditorOpen(false)}
        />
      )}

      {/* Full-Screen Instagram-Style StoryViewer Modal (Unified for Home and Gallery) */}
      {isStoryOpen && (
        <StoryViewer
          initialStory={selectedMemory}
          allMemories={allMemories}
          onClose={handleCloseViewer}
          onNavigateToUpload={() => setCurrentTab('upload')}
        />
      )}

      {/* Floating Bottom Navigation Bar (Hidden completely when shouldHideNav is true) */}
      <BottomNavBar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        isVisible={!shouldHideNav}
      />
    </div>
  );
}
