import React, { useState, useEffect, useRef } from 'react';
import { Download, X, FileImage } from 'lucide-react';

interface DownloadFilenameModalProps {
  isOpen: boolean;
  defaultFilename: string;
  activeDimString: string;
  onConfirm: (filename: string) => void;
  onCancel: () => void;
}

export const DownloadFilenameModal: React.FC<DownloadFilenameModalProps> = ({
  isOpen,
  defaultFilename,
  activeDimString,
  onConfirm,
  onCancel,
}) => {
  const [filename, setFilename] = useState(defaultFilename);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update input whenever modal opens or defaultFilename changes
  useEffect(() => {
    if (isOpen) {
      setFilename(defaultFilename);
      // Auto-focus and highlight name (without extension)
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          const dotIdx = defaultFilename.lastIndexOf('.');
          if (dotIdx > 0) {
            inputRef.current.setSelectionRange(0, dotIdx);
          } else {
            inputRef.current.select();
          }
        }
      }, 50);
    }
  }, [isOpen, defaultFilename]);

  // Handle escape key to cancel
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let name = filename.trim();
    if (!name) {
      name = defaultFilename;
    }
    // Automatically append .png if no extension is provided
    if (!name.toLowerCase().endsWith('.png')) {
      name = `${name}.png`;
    }
    // Clean any invalid filename characters
    name = name.replace(/[<>:"/\\|?*]/g, '_');
    onConfirm(name);
  };

  return (
    <div
      id="filename-confirmation-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        id="filename-confirmation-modal"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-[#181a20] border border-[#323744] shadow-2xl p-5 text-left animate-in zoom-in-95 duration-150 flex flex-col gap-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-dialog-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#252934]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/20 flex items-center justify-center text-[#d4af37]">
              <FileImage className="w-4 h-4" />
            </div>
            <div>
              <h3 id="save-dialog-title" className="text-sm font-bold text-[#f4f3ef]">
                Save & Download
              </h3>
              <p className="text-[11px] text-[#8e95a0]">
                Lossless PNG · {activeDimString}
              </p>
            </div>
          </div>

          <button
            type="button"
            id="filename-modal-close-btn"
            onClick={onCancel}
            className="w-7 h-7 rounded-lg text-[#8e95a0] hover:text-white hover:bg-[#252934] flex items-center justify-center transition-colors cursor-pointer"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label
              htmlFor="download-filename-input"
              className="block text-xs font-semibold text-[#c5c9d2] mb-1.5"
            >
              Enter Filename:
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="download-filename-input"
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="e.g. my_photo"
                className="w-full px-3 py-2 rounded-lg bg-[#0f1013] border border-[#363b48] text-sm font-mono text-white placeholder-[#5a606d] focus:outline-none focus:border-[#d4af37] focus:ring-1 focus:ring-[#d4af37] transition-all shadow-inner"
              />
            </div>
            <p className="text-[10px] text-[#717785] mt-1">
              File will be saved with a Lossless .png extension
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#252934]">
            <button
              type="button"
              id="filename-modal-cancel-btn"
              onClick={onCancel}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[#9ba1a6] hover:text-[#f4f3ef] bg-[#20232a] hover:bg-[#282d38] border border-[#2e3340] transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              id="filename-modal-save-btn"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#121316] bg-gradient-to-r from-[#d4af37] to-[#e5c158] hover:brightness-110 shadow-lg shadow-[#d4af37]/15 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Save / Download</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
