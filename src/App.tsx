import React, { useState, useEffect, useCallback } from 'react';
import {
  ColorPresetId,
  LoadedImage,
  LogoPlacement,
  ExportProgress,
  ExportResolutionMode,
  CountryId,
  TemplateId,
  HookTextConfig,
  Adjustments,
} from './types';
import { LivePhotoPreview } from './components/LivePhotoPreview';
import { TemplateSelector } from './components/TemplateSelector';
import { FacebookHookControls } from './components/FacebookHookControls';
import { AdjustmentControls } from './components/AdjustmentControls';
import { ColorPresetSelector } from './components/ColorPresetSelector';
import { CountryFlagSelector } from './components/CountryFlagSelector';
import { UploadControls } from './components/UploadControls';
import { LogoControls } from './components/LogoControls';
import { ExportSection } from './components/ExportSection';
import { DownloadFilenameModal } from './components/DownloadFilenameModal';
import {
  MASTER_LOGO_DEFAULTS,
  renderMasterCompositePNG,
  triggerBlobDownload,
  TARGET_EXPORT_DPI,
} from './utils/imageProcessor';
import { countryFlags } from './utils/countryFlags';
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

  // Active Template ('classic' | 'facebook')
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('classic');

  // Facebook Hook Text Config with single text and per-character colors
  const [hookText, setHookText] = useState<HookTextConfig>(() => {
    const initialText = 'NEW PRODUCT AVAILABLE TODAY';
    const initialColors: string[] = [];
    const firstSpace = initialText.indexOf(' ');
    for (let i = 0; i < initialText.length; i++) {
      initialColors.push(firstSpace > 0 && i < firstSpace ? '#FFD700' : '#FFFFFF');
    }
    return {
      text: initialText,
      charColors: initialColors,
      part1Text: 'NEW',
      part1Color: '#FFD700',
      part2Text: 'PRODUCT AVAILABLE TODAY',
      part2Color: '#FFFFFF',
    };
  });

  // Active Color Preset
  const [selectedPreset, setSelectedPreset] = useState<ColorPresetId>('original');

  // Selected Country Flag for bottom strip
  const [selectedCountry, setSelectedCountry] = useState<CountryId>('france');

  // Master Logo Placement Settings
  const [logoPlacement, setLogoPlacement] = useState<LogoPlacement>({ ...MASTER_LOGO_DEFAULTS });

  // Export Resolution Mode ('4k' or 'original')
  const [exportMode, setExportMode] = useState<ExportResolutionMode>('4k');

  // Photo Brightness & Contrast Adjustments (Text Master)
  const [adjustments, setAdjustments] = useState<Adjustments>({
    brightness: 100,
    contrast: 100,
  });

  // Export State
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0,
    statusText: '',
  });

  // Download Filename Confirmation Modal State
  const [isFilenameModalOpen, setIsFilenameModalOpen] = useState(false);
  const [renderedBlob, setRenderedBlob] = useState<Blob | null>(null);
  const [suggestedFilename, setSuggestedFilename] = useState('');

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
    setAdjustments({ brightness: 100, contrast: 100 });
    setSelectedCountry('france');
    setSelectedTemplate('classic');
    const initialText = 'NEW PRODUCT AVAILABLE TODAY';
    const initialColors: string[] = [];
    const firstSpace = initialText.indexOf(' ');
    for (let i = 0; i < initialText.length; i++) {
      initialColors.push(firstSpace > 0 && i < firstSpace ? '#FFD700' : '#FFFFFF');
    }
    setHookText({
      text: initialText,
      charColors: initialColors,
    });
    setLogoPlacement({ ...MASTER_LOGO_DEFAULTS });
    setExportMode('4k');
  }, []);

  // PNG Render & Export Execution (Renders first, then prompts for filename)
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
        adjustments,
        placement: logoPlacement,
        exportMode,
        countryId: selectedCountry,
        templateId: selectedTemplate,
        hookText,
        targetDpi: TARGET_EXPORT_DPI,
        onProgress: (progress, statusText) => {
          setExportProgress({
            isExporting: true,
            progress,
            statusText,
          });
        },
      });

      // Generate suggested default filename based on selected template and selected country
      const countryConfig = countryFlags[selectedCountry];
      const countryName = (countryConfig?.name || 'Country').replace(/[^a-zA-Z0-9]/g, '');
      const templatePrefix = selectedTemplate === 'facebook' ? 'TextMaster' : 'ClassicMaster';
      const autoFilename = `${templatePrefix}_${countryName}.png`;

      setRenderedBlob(blob);
      setSuggestedFilename(autoFilename);
      setIsFilenameModalOpen(true);
      setExportProgress({
        isExporting: false,
        progress: 100,
        statusText: 'Image rendered! Enter filename to save.',
      });
    } catch (err) {
      console.error('Error during render export:', err);
      setExportProgress({
        isExporting: false,
        progress: 0,
        statusText: 'Export failed. Please try again.',
      });
      alert('Could not render image: ' + (err instanceof Error ? err.message : String(err)));
    }
  }, [
    photo,
    logo,
    selectedPreset,
    adjustments,
    logoPlacement,
    exportMode,
    selectedCountry,
    selectedTemplate,
    hookText,
  ]);

  // Confirm filename and trigger actual browser download
  const handleConfirmDownload = useCallback(
    (confirmedFilename: string) => {
      if (!renderedBlob) return;
      const cleanFilename = confirmedFilename.toLowerCase().endsWith('.png')
        ? confirmedFilename
        : `${confirmedFilename}.png`;

      triggerBlobDownload(renderedBlob, cleanFilename);
      setIsFilenameModalOpen(false);
      setRenderedBlob(null);
      setExportProgress({
        isExporting: false,
        progress: 100,
        statusText: 'Download started!',
      });
    },
    [renderedBlob]
  );

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

        {/* TOP: TEMPLATE SELECTOR [TEMPLATE ▼] */}
        <TemplateSelector
          selectedTemplate={selectedTemplate}
          onSelectTemplate={setSelectedTemplate}
        />

        {/* PHOTO PREVIEW (PHOTO + [TEXT STRIP IF FACEBOOK TEMPLATE] + [EXACT FLAG COLOR STRIP]) */}
        <LivePhotoPreview
          photo={photo}
          logo={logo}
          selectedPreset={selectedPreset}
          logoPlacement={logoPlacement}
          selectedCountry={selectedCountry}
          templateId={selectedTemplate}
          hookText={hookText}
          adjustments={adjustments}
          onOpenUploadPhoto={() => document.getElementById('upload-photo-btn')?.click()}
        />

        {/* TEMPLATE-SPECIFIC CONTROLS */}
        {selectedTemplate === 'facebook' ? (
          <div className="w-full space-y-2 mb-3">
            <FacebookHookControls
              hookText={hookText}
              onChange={setHookText}
            />
            {/* Compact Brightness & Contrast Adjust Bar */}
            <div className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-[#1a1c21] border border-[#2f343e] shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[#f4f3ef]">
                  Photo Adjustments
                </span>
                <span className="text-[10px] text-[#8e95a0]">
                  (Brightness & Contrast)
                </span>
              </div>
              <AdjustmentControls
                adjustments={adjustments}
                onChange={setAdjustments}
              />
            </div>
          </div>
        ) : (
          /* Existing Template: COLOR STYLE PRESETS */
          <ColorPresetSelector
            photo={photo}
            selectedPreset={selectedPreset}
            onSelectPreset={setSelectedPreset}
          />
        )}

        {/* 4. COUNTRY FLAG STRIP (20 NATIONAL FLAGS WITH DYNAMIC PREVIEW) */}
        <CountryFlagSelector
          selectedCountry={selectedCountry}
          onSelectCountry={setSelectedCountry}
        />

        {/* 5. UPLOAD PHOTO & UPLOAD LOGO */}
        <UploadControls
          photo={photo}
          logo={logo}
          onPhotoUploaded={handlePhotoUploaded}
          onLogoUploaded={handleLogoUploaded}
          onRemoveLogo={handleRemoveLogo}
          onLoadDemo={handleResetDemo}
        />

        {/* 6. ONE LOGO CONTROLS SECTION */}
        <LogoControls
          placement={logoPlacement}
          onChange={setLogoPlacement}
          hasLogo={!!logo}
        />

        {/* 7. RESOLUTION MODE & DOWNLOAD */}
        <ExportSection
          exportMode={exportMode}
          onExportModeChange={setExportMode}
          onDownloadPNG={handleDownloadPNG}
          exportProgress={exportProgress}
          hasPhoto={!!photo}
          photoWidth={photo?.width}
          photoHeight={photo?.height}
        />

        {/* 8. DOWNLOAD FILENAME CONFIRMATION MODAL */}
        <DownloadFilenameModal
          isOpen={isFilenameModalOpen}
          defaultFilename={suggestedFilename}
          activeDimString={
            exportMode === '4k'
              ? '3840 × 4800 (4K Master)'
              : `${photo?.width || 1200} × ${photo?.height || 1500} (1:1 Native)`
          }
          onConfirm={handleConfirmDownload}
          onCancel={() => {
            setIsFilenameModalOpen(false);
            setRenderedBlob(null);
            setExportProgress({
              isExporting: false,
              progress: 0,
              statusText: '',
            });
          }}
        />

        {/* Minimal Footer */}
        <footer className="w-full text-center mt-6 pt-3 border-t border-[#1d2027] text-[10px] text-[#5a606c]">
          DREAMS AI · Deterministic 4:5 Master Compositing Engine · 3840 × 4800 4K & 300 DPI Lossless
        </footer>
      </div>
    </main>
  );
}
