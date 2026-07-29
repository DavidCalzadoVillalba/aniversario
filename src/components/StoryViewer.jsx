import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, MapPin, Send, Sparkles, Calendar, ChevronLeft, ChevronRight, ImagePlus } from 'lucide-react';

export default function StoryViewer({ initialStory, allMemories = [], onClose, onNavigateToUpload }) {
  const [activeStories, setActiveStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [toastFeedback, setToastFeedback] = useState(null);

  const STORY_DURATION = 5000; // 5 seconds per story
  const animationFrameRef = useRef(null);

  // Initialize and filter active story list strictly by Highlight title / category
  useEffect(() => {
    let filteredList = [];

    if (Array.isArray(allMemories) && allMemories.length > 0) {
      // Check if clicked item is a specific memory photo from Gallery
      const isDirectPhoto = initialStory?.id && String(initialStory.id).startsWith('mem_');

      if (isDirectPhoto) {
        // Opened from Gallery: use all uploaded memories and focus on the selected index
        filteredList = allMemories;
        const targetIndex = allMemories.findIndex((m) => m.id === initialStory.id);
        setCurrentIndex(targetIndex !== -1 ? targetIndex : 0);
      } else {
        // Opened from Highlight Circle / Category Card: Filter strictly by category title
        const targetTag = initialStory?.title || initialStory?.category || '';

        if (targetTag) {
          filteredList = allMemories.filter((m) => {
            const memoryCats = Array.isArray(m.categories)
              ? m.categories
              : m.category
              ? [m.category]
              : [];

            return memoryCats.some(
              (c) => c.toLowerCase().trim() === targetTag.toLowerCase().trim()
            );
          });
        }
        setCurrentIndex(0);
      }
    } else {
      filteredList = [];
      setCurrentIndex(0);
    }

    setActiveStories(filteredList);
    setProgress(0);
  }, [initialStory, allMemories]);

  // Current Story Item
  const currentStory = activeStories[currentIndex];

  // Progress Bar Timer (5 Seconds Animation)
  useEffect(() => {
    if (isPaused || activeStories.length === 0 || !currentStory) return;

    let startTime = performance.now() - (progress / 100) * STORY_DURATION;

    const updateProgress = (currentTime) => {
      const elapsedTime = currentTime - startTime;
      const newProgress = (elapsedTime / STORY_DURATION) * 100;

      if (newProgress >= 100) {
        setProgress(100);
        if (currentIndex < activeStories.length - 1) {
          setCurrentIndex((prev) => prev + 1);
          setProgress(0);
        } else {
          onClose();
        }
      } else {
        setProgress(newProgress);
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentIndex, isPaused, activeStories.length, currentStory]);

  // Handle Next & Previous Navigation
  const handleNext = () => {
    if (currentIndex < activeStories.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    } else {
      setProgress(0);
    }
  };

  // Handle Comment Submission
  const handleSendComment = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setToastFeedback('¡Mensaje enviado con amor! ❤️');
    setCommentText('');

    setTimeout(() => {
      setToastFeedback(null);
    }, 2000);
  };

  // Friendly Empty State if Highlight contains 0 photos
  if (activeStories.length === 0 || !currentStory) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1e1b4b]/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none">
        <div className="silk-convex max-w-sm w-full rounded-3xl p-6 sm:p-8 relative flex flex-col items-center text-center space-y-4">
          <button
            onClick={onClose}
            aria-label="Cerrar modal"
            className="absolute top-4 right-4 p-2 rounded-full silk-convex text-[#1e1b4b] hover:text-[#4338ca] transition-colors z-10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-4 rounded-full silk-convex text-[#4338ca]">
            <ImagePlus className="w-10 h-10 text-[#4338ca]" />
          </div>

          <div className="space-y-1">
            <span className="inline-flex items-center space-x-1 text-xs font-semibold text-[#4338ca] uppercase tracking-wider font-jakarta">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sin Fotos Aún</span>
            </span>
            <h3 className="font-playfair italic text-2xl font-bold text-[#312e81]">
              {initialStory?.title || 'Destacada Vacía'}
            </h3>
            <p className="text-xs sm:text-sm text-[#1e1b4b]/70 font-jakarta leading-relaxed pt-1">
              Aún no has subido fotos asignadas a "{initialStory?.title || 'esta historia'}". ¡Añade tu primer recuerdo!
            </p>
          </div>

          <div className="pt-2 w-full space-y-2">
            {onNavigateToUpload && (
              <button
                onClick={() => {
                  onClose();
                  onNavigateToUpload();
                }}
                className="silk-button-primary py-3 px-6 rounded-2xl w-full font-bold text-sm font-jakarta cursor-pointer"
              >
                Subir Foto a Esta Destacada
              </button>
            )}

            <button
              onClick={onClose}
              className="neo-button py-2.5 px-6 rounded-2xl w-full font-semibold text-xs text-[#312e81] cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center select-none animate-fadeIn">
      {/* Container simulating mobile story phone viewport with 100dvh */}
      <div className="relative w-full max-w-md h-[100dvh] md:h-[92vh] md:max-h-[850px] md:rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between bg-[#1e1b4b]">
        
        {/* BACKGROUND BLURRED FILLER & MAIN RESIZABLE STORY IMAGE */}
        <div className="absolute inset-0 z-0 flex items-center justify-center overflow-hidden">
          {/* Blurred filler background image so container edges look seamless */}
          <img
            src={currentStory.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-30 transition-all duration-500"
          />
          {/* Main Story Image (object-contain to avoid cropping/distortion) */}
          <img
            src={currentStory.image}
            alt={currentStory.title}
            className="max-h-full w-auto max-w-full object-contain mx-auto my-auto relative z-0 transition-all duration-500"
          />
          {/* Dark Overlay Gradient */}
          <div className="absolute inset-0 story-gradient z-0 pointer-events-none" />
        </div>

        {/* TOP CONTROLS & PROGRESS BARS WITH MOBILE SAFE TOP PADDING */}
        <div className="relative z-10 pt-[max(1rem,env(safe-area-inset-top))] px-4 pb-4 space-y-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          {/* Progress Segmented Bar */}
          <div className="flex items-center space-x-1.5 w-full">
            {activeStories.map((_, idx) => {
              let segmentWidth = '0%';
              if (idx < currentIndex) {
                segmentWidth = '100%';
              } else if (idx === currentIndex) {
                segmentWidth = `${progress}%`;
              }

              return (
                <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-white transition-all duration-75 ease-linear rounded-full"
                    style={{ width: segmentWidth }}
                  />
                </div>
              );
            })}
          </div>

          {/* Top Bar Header */}
          <div className="flex items-center justify-between text-white pt-1">
            <div className="flex items-center space-x-2.5">
              {/* Circular Avatar */}
              <div className="w-10 h-10 rounded-full p-0.5 bg-gradient-to-tr from-[#312e81] via-[#4338ca] to-[#818cf8] shadow-md">
                <img
                  src={currentStory.image}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              </div>

              <div>
                <h3 className="font-playfair italic font-bold text-sm sm:text-base leading-none text-white drop-shadow">
                  Gorditos
                </h3>
                <span className="text-[11px] text-white/80 font-jakarta font-medium">
                  {currentStory.date || 'Recuerdo Especial'}
                </span>
              </div>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              aria-label="Cerrar historias"
              className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white transition-all backdrop-blur-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CLICK TOUCH NAVIGATION ZONES (Left 30% / Right 70%) */}
        <div
          className="absolute inset-0 z-0 flex"
          onMouseDown={() => setIsPaused(true)}
          onMouseUp={() => setIsPaused(false)}
          onTouchStart={() => setIsPaused(true)}
          onTouchEnd={() => setIsPaused(false)}
        >
          {/* 30% Left Zone -> Previous Story */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="w-[30%] h-full cursor-pointer group flex items-center justify-start pl-2"
          >
            <span className="p-2 rounded-full bg-black/20 text-white/40 group-hover:text-white group-hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100">
              <ChevronLeft className="w-6 h-6" />
            </span>
          </div>

          {/* 70% Right Zone -> Next Story */}
          <div
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="w-[70%] h-full cursor-pointer group flex items-center justify-end pr-2"
          >
            <span className="p-2 rounded-full bg-black/20 text-white/40 group-hover:text-white group-hover:bg-black/40 transition-all opacity-0 group-hover:opacity-100">
              <ChevronRight className="w-6 h-6" />
            </span>
          </div>
        </div>

        {/* BOTTOM EMOTIONAL CONTENT OVERLAY WITH MOBILE SAFE BOTTOM PADDING */}
        <div className="relative z-10 pb-[max(1.25rem,env(safe-area-inset-bottom))] p-5 sm:p-6 space-y-4 text-white bg-gradient-to-t from-black/90 via-black/50 to-transparent">
          
          {/* Toast feedback */}
          {toastFeedback && (
            <div className="silk-badge px-4 py-2 rounded-xl text-xs font-bold font-jakarta text-center animate-bounce shadow-xl">
              {toastFeedback}
            </div>
          )}

          {/* Date & Category Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="silk-badge px-3 py-1 rounded-full text-xs font-bold font-jakarta flex items-center space-x-1">
              <Calendar className="w-3 h-3 text-[#4338ca]" />
              <span>{currentStory.date}</span>
            </span>

            {/* Display categories tags */}
            {(currentStory.categories || [currentStory.category]).map(
              (cat, i) =>
                cat && (
                  <span
                    key={i}
                    className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold font-jakarta text-white"
                  >
                    {cat}
                  </span>
                )
            )}
          </div>

          {/* Large Italic Title */}
          <h2 className="font-playfair italic text-2xl sm:text-3xl md:text-4xl font-bold leading-tight text-white drop-shadow-lg break-words">
            {currentStory.title}
          </h2>

          {/* Location */}
          {currentStory.location && (
            <div className="flex items-center space-x-1.5 text-xs sm:text-sm text-indigo-100/90 font-jakarta">
              <MapPin className="w-4 h-4 text-[#818cf8]" />
              <span className="truncate">{currentStory.location}</span>
            </div>
          )}

          {/* Bottom Interactive Message Bar */}
          <form onSubmit={handleSendComment} className="pt-2 flex items-center space-x-3">
            <div className="flex-1 relative">
              <input
                type="text"
                value={commentText}
                onFocus={() => setIsPaused(true)}
                onBlur={() => setIsPaused(false)}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Envía un mensaje..."
                className="w-full bg-white/20 backdrop-blur-md text-white placeholder-white/70 px-4 py-3 rounded-full text-base sm:text-sm font-jakarta border border-white/30 focus:outline-none focus:ring-2 focus:ring-[#818cf8]"
              />
              {commentText.trim() && (
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-[#4338ca] text-white cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Like Heart Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
              className={`p-3 rounded-full transition-all duration-300 cursor-pointer ${
                isLiked
                  ? 'bg-red-500 text-white scale-110 shadow-lg shadow-red-500/50'
                  : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30'
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-transform ${
                  isLiked ? 'fill-white scale-110' : 'text-white'
                }`}
              />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
