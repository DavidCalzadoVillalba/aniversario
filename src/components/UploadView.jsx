import React, { useState, useRef } from 'react';
import { ImagePlus, Calendar, MapPin, Sparkles, CheckCircle2, Trash2, UploadCloud, Heart, Plus, Images } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';
import { saveMemoryToCloud, uploadImageToSupabase } from '../utils/supabaseService';

export default function UploadView({ onNavigateToGallery }) {
  const fileInputRef = useRef(null);

  // Form State
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [location, setLocation] = useState('');
  
  // Selected Multiple Files State: Array of { id, file, preview }
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null); // { current, total, percentage, message }
  const [toastMessage, setToastMessage] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  // Helper to process multiple files
  const processFiles = async (filesList) => {
    const validFiles = Array.from(filesList).filter((f) => f.type.startsWith('image/'));

    if (validFiles.length === 0) {
      setErrorMsg('Por favor, selecciona archivos de imagen válidos.');
      return;
    }
    setErrorMsg(null);

    try {
      const processedItems = await Promise.all(
        validFiles.map(async (file) => {
          let previewUrl;
          try {
            previewUrl = await compressImage(file, 1200, 0.7);
          } catch (e) {
            const reader = new FileReader();
            previewUrl = await new Promise((res) => {
              reader.onload = (ev) => res(ev.target.result);
              reader.readAsDataURL(file);
            });
          }
          return {
            id: 'file_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            file,
            preview: previewUrl,
          };
        })
      );

      setSelectedFiles((prev) => [...prev, ...processedItems]);
    } catch (err) {
      console.error('Error al procesar archivos de imagen:', err);
      setErrorMsg('Error al cargar la vista previa de algunas imágenes.');
    }
  };

  // Remove single file from preview list
  const removeFile = (idToRemove) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    e.target.value = ''; // Reset input to allow selecting same files if needed
  };

  // Form Submission Handler for Multiple Batch Upload
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      setErrorMsg('Por favor, selecciona o arrastra al menos una imagen para subir el recuerdo.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('Por favor, ingresa un título para el recuerdo.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    const totalCount = selectedFiles.length;

    try {
      // Batch upload loop with real-time progress update
      for (let i = 0; i < totalCount; i++) {
        const item = selectedFiles[i];
        const currentNum = i + 1;
        const percent = Math.round((currentNum / totalCount) * 100);

        setUploadProgress({
          current: currentNum,
          total: totalCount,
          percentage: percent,
          message: `Subiendo foto ${currentNum} de ${totalCount}...`,
        });

        // 1. Upload compressed photo to Supabase Storage
        const imageUrl = await uploadImageToSupabase(item.file || item.preview);

        // 2. Construct memory record
        const newMemory = {
          id: 'mem_' + Date.now() + '_' + i,
          title: totalCount > 1 ? `${title.trim()} (${currentNum})` : title.trim(),
          date: date || new Date().toISOString().split('T')[0],
          categories: [],
          category: '',
          location: location.trim(),
          image: imageUrl,
        };

        // 3. Save memory to Supabase & localStorage
        await saveMemoryToCloud(newMemory);
      }

      setToastMessage(
        totalCount === 1
          ? '¡Recuerdo guardado con éxito!'
          : `¡${totalCount} recuerdos guardados con éxito!`
      );
      setUploadProgress(null);

      // Redirect to Gallery after short delay
      setTimeout(() => {
        if (onNavigateToGallery) {
          onNavigateToGallery();
        }
      }, 1000);
    } catch (err) {
      console.error('Error al subir grupo de recuerdos:', err);
      setErrorMsg('Ocurrió un error al subir los recuerdos. Por favor, inténtalo de nuevo.');
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6 animate-fadeIn pb-6 overflow-x-hidden">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 silk-convex px-6 py-3.5 rounded-2xl flex items-center space-x-3 text-[#312e81] shadow-2xl border border-white/60 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-[#4338ca]" />
          <span className="font-semibold text-sm font-jakarta">{toastMessage}</span>
        </div>
      )}

      {/* Title & Subtitle */}
      <div className="text-center space-y-2">
        <span className="inline-flex items-center space-x-1.5 px-3.5 py-1 rounded-full text-xs font-bold text-[#4338ca] bg-[#4338ca]/10 uppercase tracking-wider font-jakarta">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Subida Múltiple</span>
        </span>
        <h2 className="font-playfair italic text-3xl sm:text-4xl md:text-5xl font-bold text-[#312e81] leading-tight break-words">
          Añadir Nuevos Momentos
        </h2>
        <p className="text-xs sm:text-sm text-[#1e1b4b]/70 font-jakarta max-w-md mx-auto leading-relaxed">
          Selecciona una o varias fotos a la vez para añadirlas juntas a nuestra historia.
        </p>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="silk-concave p-4 rounded-2xl text-red-700 bg-red-500/10 text-xs sm:text-sm text-center font-jakarta border border-red-300/40">
          {errorMsg}
        </div>
      )}

      {/* Main Upload Card */}
      <form onSubmit={handleSubmit} className="silk-convex rounded-3xl p-5 sm:p-8 space-y-6 w-full">
        
        {/* ZONA DE CARGA (MULTIPLE FILE INPUT / DRAG & DROP) */}
        <div className="space-y-3 w-full">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#312e81] font-jakarta">
              Fotografías del Recuerdo *
            </label>
            {selectedFiles.length > 0 && (
              <span className="inline-flex items-center space-x-1 text-xs font-bold text-[#4338ca] bg-[#4338ca]/10 px-3 py-0.5 rounded-full font-jakarta">
                <Images className="w-3.5 h-3.5" />
                <span>
                  {selectedFiles.length} {selectedFiles.length === 1 ? 'foto seleccionada' : 'fotos seleccionadas'}
                </span>
              </span>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="hidden"
          />

          {selectedFiles.length === 0 ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className={`w-full min-h-[220px] sm:min-h-[260px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 select-none ${
                isDragging
                  ? 'silk-concave neo-pressed border-[#4338ca] scale-[0.99]'
                  : 'silk-convex hover:scale-[1.005] border-[#312e81]/30 hover:border-[#4338ca]'
              }`}
            >
              <div className="p-4 rounded-full silk-convex text-[#4338ca] mb-3 group-hover:scale-110 transition-transform">
                <ImagePlus className="w-8 h-8 sm:w-10 sm:h-10 text-[#4338ca]" />
              </div>
              <h3 className="font-playfair italic text-lg sm:text-xl font-bold text-[#312e81] mb-1">
                Suelta una o varias fotos aquí
              </h3>
              <p className="text-xs sm:text-sm text-[#1e1b4b]/70 font-jakarta max-w-xs">
                Arrastra y suelta tus archivos de imagen o haz clic para explorar en tu dispositivo.
              </p>
              <span className="inline-flex items-center space-x-1.5 mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-[#4338ca] silk-convex">
                <UploadCloud className="w-4 h-4" />
                <span>Explorar Archivos</span>
              </span>
            </div>
          ) : (
            /* PREVISUALIZACIÓN MULTIPLE NEUMÓRFICA (GRID) */
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 max-h-96 overflow-y-auto no-scrollbar p-1">
                {selectedFiles.map((item, index) => (
                  <div
                    key={item.id}
                    className="relative group rounded-2xl overflow-hidden silk-concave p-1.5 border border-white/60 aspect-square shadow-sm"
                  >
                    <img
                      src={item.preview}
                      alt={`Vista previa ${index + 1}`}
                      className="w-full h-full object-cover rounded-xl"
                    />
                    <span className="absolute top-3 left-3 bg-[#312e81]/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      #{index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(item.id)}
                      className="absolute top-3 right-3 p-1.5 rounded-full bg-[#e0e7ff]/90 backdrop-blur-md text-red-600 silk-convex hover:scale-110 transition-all shadow-md cursor-pointer"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Botón para añadir más fotos */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="rounded-2xl border-2 border-dashed border-[#4338ca]/40 flex flex-col items-center justify-center p-3 text-center silk-convex hover:scale-105 transition-all cursor-pointer aspect-square text-[#4338ca]"
                >
                  <Plus className="w-6 h-6 mb-1" />
                  <span className="text-[11px] font-bold font-jakarta">Añadir Más</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* INDICADOR DE PROGRESO DE SUBIDA EN LOTE */}
        {uploadProgress && (
          <div className="silk-convex rounded-2xl p-4 space-y-2 border border-white/60 animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-semibold font-jakarta text-[#312e81]">
              <span>{uploadProgress.message}</span>
              <span>{uploadProgress.percentage}%</span>
            </div>
            <div className="w-full h-3.5 rounded-full silk-concave overflow-hidden p-0.5">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#312e81] to-[#4338ca] transition-all duration-300 shadow-sm"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* FORMULARIO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 w-full">
          
          {/* Título del Recuerdo */}
          <div className="space-y-1.5 md:col-span-2 w-full">
            <label htmlFor="title" className="block text-xs font-semibold uppercase tracking-wider text-[#312e81] font-jakarta">
              Título del Recuerdo *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Atardecer mágico en el mirador"
              className="w-full px-4 py-3 rounded-2xl silk-input font-jakarta text-base placeholder-[#1e1b4b]/40"
              required
            />
          </div>

          {/* Fecha */}
          <div className="space-y-1.5 md:col-span-1 w-full">
            <label htmlFor="date" className="flex items-center space-x-1 text-xs font-semibold uppercase tracking-wider text-[#312e81] font-jakarta">
              <Calendar className="w-3.5 h-3.5 text-[#4338ca]" />
              <span>Fecha *</span>
            </label>
            <input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl silk-input font-jakarta text-base text-[#1e1b4b]"
              required
            />
          </div>

          {/* Ubicación */}
          <div className="space-y-1.5 md:col-span-1 w-full">
            <label htmlFor="location" className="flex items-center space-x-1 text-xs font-semibold uppercase tracking-wider text-[#312e81] font-jakarta">
              <MapPin className="w-3.5 h-3.5 text-[#4338ca]" />
              <span>Ubicación (Opcional)</span>
            </label>
            <input
              id="location"
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ej: Costa Brava, España"
              className="w-full px-4 py-3 rounded-2xl silk-input font-jakarta text-base placeholder-[#1e1b4b]/40"
            />
          </div>
        </div>

        {/* BOTÓN PRIMARIO DE GUARDADO */}
        <div className="pt-4 w-full">
          <button
            type="submit"
            disabled={isSaving || selectedFiles.length === 0}
            className="w-full py-4 px-6 rounded-2xl silk-button-primary font-bold text-base sm:text-lg font-jakarta flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-md"
          >
            <Heart className="w-5 h-5 fill-white text-white animate-pulse" />
            <span>
              {isSaving
                ? `Subiendo ${uploadProgress ? uploadProgress.current : 1} de ${selectedFiles.length}...`
                : selectedFiles.length > 1
                ? `Subir ${selectedFiles.length} Fotos a Nuestra Historia`
                : 'Subir a Nuestra Historia'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
