import React, { useState, useEffect, useCallback } from 'react';
import { ColorPresetId, LoadedImage, LogoPlacement, ExportProgress, ExportResolutionMode } from './types';
import { LivePhotoPreview } from './components/LivePhotoPreview';
import { ColorPresetSelector } from './components/ColorPresetSelector';
import { UploadControls } from './components/UploadControls';
import { LogoControls } from './components/LogoControls';
import { ExportSection } from './components/ExportSection';
import {
  MASTER_LOGO_DEFAULTS,
  renderMasterCompositePNG,
  sanitizeFilename,
  triggerBlobDownload,
  TARGET_EXPORT_DPI,
} from './utils/imageProcessor';
import { detectImageDpi } from './utils/pngDpi';
import {
  DEFAULT_PHOTO_URL,
  DEFAULT_PHOTO_NAME,
  DEFAULT_LOGO_SVG,
  DEFAULT_LOGO_NAME,
} from './utils/sampleData';
import { Shield, RefreshCw } from 'lucide-react';
import dreamsAiLogo from './assets/images/dreams_ai_logo_1788188603339.jpg';

export default function App() {
  // Master Photo State
  const [photo, setPhoto] = useState<LoadedImage | null>(null);

  // Logo State
  const [logo, setLogo] = useState<LoadedImage | null>(null);

  // Active Color Preset
  const [selectedPreset, setSelectedPreset] = useState<ColorPresetId>('original');

  // Master Logo Placement Settings
  const [logoPlacement, setLogoPlacement] = useState<LogoPlacement>({ ...MASTER_LOGO_DEFAULTS });

  // Export Resolution Mode ('4k' or 'original')
  const [exportMode, setExportMode] = useState<ExportResolutionMode>('4k');

  // Custom File Name
  const [filename, setFilename] = useState<string>('dreams_photo_01');

  // Export State
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0,
    statusText: '',
  });

  // Load initial demo photo & logo on first mount for immediate live preview
  useEffect(() => {
    // Load default demo 4:5 photo
    const photoImg = new Image();
    photoImg.crossOrigin = 'anonymous';
    photoImg.onload = () => {
      setPhoto({
        src: DEFAULT_PHOTO_URL,
        name: DEFAULT_PHOTO_NAME,
        width: photoImg.naturalWidth || 1200,
        height: photoImg.naturalHeight || 1500,
        aspectRatio: (photoImg.naturalWidth || 1200) / (photoImg.naturalHeight || 1500),
      });
    };
    photoImg.src = DEFAULT_PHOTO_URL;

    // Load default master logo
    const logoImg = new Image();
    logoImg.crossOrigin = 'anonymous';
    logoImg.onload = () => {
      setLogo({
        src: DEFAULT_LOGO_SVG,
        name: DEFAULT_LOGO_NAME,
        width: logoImg.naturalWidth || 240,
        height: logoImg.naturalHeight || 240,
        aspectRatio: 1,
      });
    };
    logoImg.src = DEFAULT_LOGO_SVG;
  }, []);

  // Handle Photo Upload
  const handlePhotoUploaded = useCallback(async (file: File) => {
    // Detect resolution metadata (DPI/PPI) if present in original file
    let detectedDpi: number | null = null;
    try {
      detectedDpi = await detectImageDpi(file);
      if (detectedDpi) {
        console.info(`[DREAMS AI] Detected input photo resolution metadata: ${detectedDpi} DPI`);
      }
    } catch (e) {
      console.warn('Could not read image DPI metadata:', e);
    }

    // Create object URL for ultra-fast, zero-re-encoding memory access
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setPhoto({
        src: objectUrl,
        file,
        name: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / (img.naturalHeight || 1),
        detectedDpi,
      });
      // Auto-generate clean base filename from uploaded file
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
      setFilename(cleanName || 'edited_photo');
    };
    img.src = objectUrl;
  }, []);

  // Handle Logo Upload
  const handleLogoUploaded = useCallback((file: File) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setLogo({
        src: objectUrl,
        file,
        name: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / (img.naturalHeight || 1),
      });
    };
    img.src = objectUrl;
  }, []);

  // Handle Logo Removal
  const handleRemoveLogo = useCallback(() => {
    setLogo(null);
  }, []);

  // Handle Reset to Demo
  const handleResetDemo = useCallback(() => {
    setPhoto({
      src: DEFAULT_PHOTO_URL,
      name: DEFAULT_PHOTO_NAME,
      width: 1200,
      height: 1500,
      aspectRatio: 0.8,
    });
    setLogo({
      src: DEFAULT_LOGO_SVG,
      name: DEFAULT_LOGO_NAME,
      width: 240,
      height: 240,
      aspectRatio: 1,
    });
    setSelectedPreset('original');
    setLogoPlacement({ ...MASTER_LOGO_DEFAULTS });
    setFilename('dreams_photo_01');
    setExportMode('4k');
  }, []);

  // PNG Render & Export Execution (4K Master or Original Dimensions)
  const handleDownloadPNG = useCallback(async () => {
    if (!photo) return;

    try {
      setExportProgress({
        isExporting: true,
        progress: 5,
        statusText: 'Accessing original photograph source...',
      });

      const blob = await renderMasterCompositePNG({
        photoSource: photo.file || photo.src,
        logoSource: logo ? (logo.file || logo.src) : null,
        presetId: selectedPreset,
        placement: logoPlacement,
        exportMode,
        targetDpi: TARGET_EXPORT_DPI,
        onProgress: (progress, statusText) => {
          setExportProgress({
            isExporting: true,
            progress,
            statusText,
          });
        },
      });

      const finalFilename = sanitizeFilename(filename);
      triggerBlobDownload(blob, finalFilename);

      setTimeout(() => {
        setExportProgress({
          isExporting: false,
          progress: 100,
          statusText: 'Download started!',
        });
      }, 600);
    } catch (err) {
      console.error('Error during render export:', err);
      setExportProgress({
        isExporting: false,
        progress: 0,
        statusText: 'Export failed. Please try again.',
      });
      alert('Could not render image: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [photo, logo, selectedPreset, logoPlacement, exportMode, filename]);

  return (
    <main className="min-h-screen bg-[#121316] text-[#f4f3ef] flex flex-col items-center justify-start py-4 px-3 sm:px-4">
      {/* Maximum compact container for mobile-first precision */}
      <div className="w-full max-w-[460px] flex flex-col items-center">
        {/* Header: Brand DREAMS AI */}
        <header className="w-full flex items-center justify-between pb-3 mb-2 border-b border-[#22252c]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full overflow-hidden border border-[#d4af37]/60 flex items-center justify-center shadow-md bg-[#1a1c21] shrink-0 p-0.5">
              <img
                src={dreamsAiLogo}
                alt="DREAMS AI Logo"
                className="w-full h-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="font-cinzel text-lg font-bold tracking-widest text-[#f4f3ef] leading-tight">
                DREAMS AI
              </h1>
              <span className="text-[10px] tracking-wider text-[#9ba1a6] uppercase font-semibold">
                4:5 Color & Master Logo Studio
              </span>
            </div>
          </div>

          <button
            type="button"
            id="reset-sample-btn"
            onClick={handleResetDemo}
            className="flex items-center gap-1 text-[11px] text-[#9ba1a6] hover:text-[#d4af37] px-2 py-1 rounded bg-[#1a1c21] hover:bg-[#20232a] border border-[#2a2e38] transition-colors cursor-pointer"
            title="Reset to Sample Portrait & Logo"
          >
            <RefreshCw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset Sample</span>
          </button>
        </header>

        {/* 1. LARGE PHOTO LIVE PREVIEW (TOP OF INTERFACE) */}
        <LivePhotoPreview
          photo={photo}
          logo={logo}
          selectedPreset={selectedPreset}
          logoPlacement={logoPlacement}
          onOpenUploadPhoto={() => document.getElementById('upload-photo-btn')?.click()}
        />

        {/* 2. COLOR STYLE (6 PRESETS IN ONE COMPACT ROW) */}
        <ColorPresetSelector
          photo={photo}
          selectedPreset={selectedPreset}
          onSelectPreset={setSelectedPreset}
        />

        {/* 3. UPLOAD PHOTO & UPLOAD LOGO */}
        <UploadControls
          photo={photo}
          logo={logo}
          onPhotoUploaded={handlePhotoUploaded}
          onLogoUploaded={handleLogoUploaded}
          onRemoveLogo={handleRemoveLogo}
          onLoadDemo={handleResetDemo}
        />

        {/* 4. ONE LOGO CONTROLS SECTION */}
        <LogoControls
          placement={logoPlacement}
          onChange={setLogoPlacement}
          hasLogo={!!logo}
        />

        {/* 5. FILE NAME, RESOLUTION MODE & DOWNLOAD */}
        <ExportSection
          filename={filename}
          onFilenameChange={setFilename}
          exportMode={exportMode}
          onExportModeChange={setExportMode}
          onDownloadPNG={handleDownloadPNG}
          exportProgress={exportProgress}
          hasPhoto={!!photo}
          photoWidth={photo?.width}
          photoHeight={photo?.height}
        />

        {/* Minimal Footer */}
        <footer className="w-full text-center mt-6 pt-3 border-t border-[#1d2027] text-[10px] text-[#5a606c]">
          DREAMS AI · Deterministic 4:5 Master Compositing Engine · 3840 × 4800 4K & 300 DPI Lossless
        </footer>
      </div>
    </main>
  );
}
