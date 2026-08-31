import React from 'react';
import { Download, Loader2, FileCheck, Sparkles, Image as ImageIcon } from 'lucide-react';
import { ExportProgress, ExportResolutionMode } from '../types';

interface ExportSectionProps {
  filename: string;
  onFilenameChange: (val: string) => void;
  exportMode: ExportResolutionMode;
  onExportModeChange: (mode: ExportResolutionMode) => void;
  onDownloadPNG: () => void;
  exportProgress: ExportProgress;
  hasPhoto: boolean;
  photoWidth?: number;
  photoHeight?: number;
}

export const ExportSection: React.FC<ExportSectionProps> = ({
  filename,
  onFilenameChange,
  exportMode,
  onExportModeChange,
  onDownloadPNG,
  exportProgress,
  hasPhoto,
  photoWidth,
  photoHeight,
}) => {
  const originalDimString = photoWidth && photoHeight ? `${photoWidth} × ${photoHeight}` : 'Original Resolution';
  const activeDimString = exportMode === '4k' ? '3840 × 4800' : originalDimString;

  return (
    <div className="w-full mt-3 space-y-3">
      {/* File Name Section */}
      <div className="w-full bg-[#1a1c21] border border-[#2f343e] rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between mb-1.5">
          <label
            htmlFor="custom-filename-input"
            className="text-[11px] font-semibold tracking-wider text-[#9ba1a6] uppercase"
          >
            FILE NAME
          </label>
          <span className="text-[10px] text-[#71767e]">
            Auto-appends .png
          </span>
        </div>

        <div className="relative flex items-center">
          <input
            id="custom-filename-input"
            type="text"
            value={filename}
            onChange={(e) => onFilenameChange(e.target.value)}
            placeholder="edited_photo"
            className="w-full bg-[#121316] border border-[#2a2e38] focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] text-xs text-[#f4f3ef] font-mono px-3 py-2 rounded-lg transition-all pr-12 outline-none"
          />
          <span className="absolute right-3 text-[11px] font-mono text-[#71767e] pointer-events-none">
            .png
          </span>
        </div>
      </div>

      {/* Export Resolution Selector */}
      <div className="w-full bg-[#1a1c21] border border-[#2f343e] rounded-xl p-3 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold tracking-wider text-[#9ba1a6] uppercase flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#d4af37]" />
            EXPORT RESOLUTION
          </span>
          <span className="text-[10px] text-[#d4af37] font-medium font-mono">
            300 DPI Lossless
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* 4K Maximum Quality Option */}
          <button
            type="button"
            id="export-mode-4k-btn"
            onClick={() => onExportModeChange('4k')}
            className={`flex flex-col text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
              exportMode === '4k'
                ? 'bg-[#262a34] border-[#d4af37] shadow-sm shadow-[#d4af37]/10'
                : 'bg-[#14161a] border-[#2a2e38] text-[#9ba1a6] hover:border-[#3d4350]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className={`text-xs font-bold ${exportMode === '4k' ? 'text-[#f4f3ef]' : 'text-[#c0c5ce]'}`}>
                4K Maximum Quality
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  exportMode === '4k' ? 'bg-[#d4af37] text-[#121316]' : 'bg-[#22252c] text-[#71767e]'
                }`}
              >
                4:5 MASTER
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-mono text-[#d4af37] font-semibold">
              <span>3840 × 4800 px</span>
            </div>
            <span className="text-[10px] text-[#71767e] mt-0.5 leading-tight">
              High-fidelity pixel enlargement
            </span>
          </button>

          {/* Original Resolution Option */}
          <button
            type="button"
            id="export-mode-original-btn"
            onClick={() => onExportModeChange('original')}
            className={`flex flex-col text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
              exportMode === 'original'
                ? 'bg-[#262a34] border-[#d4af37] shadow-sm shadow-[#d4af37]/10'
                : 'bg-[#14161a] border-[#2a2e38] text-[#9ba1a6] hover:border-[#3d4350]'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className={`text-xs font-bold ${exportMode === 'original' ? 'text-[#f4f3ef]' : 'text-[#c0c5ce]'}`}>
                Original Resolution
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  exportMode === 'original' ? 'bg-[#d4af37] text-[#121316]' : 'bg-[#22252c] text-[#71767e]'
                }`}
              >
                1:1 NATIVE
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[11px] font-mono text-[#d4af37] font-semibold truncate">
              <span>{originalDimString}</span>
            </div>
            <span className="text-[10px] text-[#71767e] mt-0.5 leading-tight">
              Zero scaling / exact pixels
            </span>
          </button>
        </div>
      </div>

      {/* Final Output Information Card */}
      <div className="w-full bg-[#16181d] border border-[#262a33] rounded-xl p-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold tracking-widest text-[#9ba1a6] uppercase block">
            FINAL OUTPUT TARGET
          </span>
          <div className="flex items-center gap-2 mt-1 text-xs text-[#e1e4ea]">
            <span className="font-semibold text-[#f4f3ef]">PNG</span>
            <span className="text-[#5a606c]">·</span>
            <span className="font-mono text-[#d4af37] font-semibold">{activeDimString}</span>
            <span className="text-[#5a606c]">·</span>
            <span className="text-[#9ba1a6]">{exportMode === '4k' ? '4:5 Master' : '1:1 Original'}</span>
            <span className="text-[#5a606c]">·</span>
            <span className="font-mono text-[#d4af37] font-medium text-[11px]">300 DPI</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-[#1e2127] border border-[#2f343e] text-[10px] text-[#9ba1a6]">
          <FileCheck className="w-3.5 h-3.5 text-[#d4af37]" />
          <span>Lossless · 300 DPI</span>
        </div>
      </div>

      {/* Primary Download Button */}
      <button
        type="button"
        id="download-png-btn"
        data-testid="download-btn"
        disabled={!hasPhoto || exportProgress.isExporting}
        onClick={onDownloadPNG}
        className={`w-full relative group overflow-hidden py-3.5 px-4 rounded-xl font-semibold transition-all duration-200 shadow-xl flex items-center justify-center gap-3 cursor-pointer ${
          !hasPhoto || exportProgress.isExporting
            ? 'bg-[#22252c] text-[#71767e] border border-[#2f343e] cursor-not-allowed'
            : 'bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c5a059] text-[#121316] hover:brightness-110 active:scale-[0.99] shadow-[#d4af37]/15'
        }`}
      >
        {exportProgress.isExporting ? (
          <div className="flex items-center gap-2.5">
            <Loader2 className="w-5 h-5 animate-spin text-[#121316]" />
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold leading-tight uppercase tracking-wider text-[#121316]">
                {exportMode === '4k' ? 'GENERATING 4K MASTER PNG...' : 'GENERATING ORIGINAL PNG...'}
              </span>
              <span className="text-[10px] text-[#121316]/80 leading-none mt-0.5">
                {exportProgress.statusText || 'Processing lossless pipeline...'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#121316]/10 flex items-center justify-center">
                <Download className="w-4 h-4 text-[#121316] stroke-[2.5]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-bold tracking-wide leading-tight">
                  {exportMode === '4k' ? 'DOWNLOAD 4K PNG' : 'DOWNLOAD ORIGINAL PNG'}
                </span>
                <span className="text-[10px] text-[#121316]/80 font-medium tracking-tight">
                  {exportMode === '4k' ? '3840 × 4800 · Lossless 300 DPI' : 'Original Resolution · 100% Quality'}
                </span>
              </div>
            </div>

            <span className="px-2 py-0.5 rounded bg-[#121316]/15 font-mono text-xs font-bold text-[#121316]">
              {activeDimString}
            </span>
          </div>
        )}
      </button>

      {/* Progress Bar when exporting */}
      {exportProgress.isExporting && (
        <div className="w-full bg-[#16181d] rounded-full h-1.5 overflow-hidden border border-[#2a2e38]">
          <div
            className="bg-[#d4af37] h-full transition-all duration-300 ease-out"
            style={{ width: `${exportProgress.progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
