import React, { useRef } from 'react';
import { LoadedImage } from '../types';
import { Upload, Image as ImageIcon, ShieldAlert, Sparkles, Trash2 } from 'lucide-react';

interface UploadControlsProps {
  photo: LoadedImage | null;
  logo: LoadedImage | null;
  onPhotoUploaded: (file: File) => void;
  onLogoUploaded: (file: File) => void;
  onRemoveLogo?: () => void;
  onLoadDemo?: () => void;
}

export const UploadControls: React.FC<UploadControlsProps> = ({
  photo,
  logo,
  onPhotoUploaded,
  onLogoUploaded,
  onRemoveLogo,
  onLoadDemo,
}) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onPhotoUploaded(file);
      e.target.value = '';
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLogoUploaded(file);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full mt-3">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={photoInputRef}
        onChange={handlePhotoFileChange}
        accept="image/png,image/jpeg,image/jpg,image/webp"
        className="hidden"
      />
      <input
        type="file"
        ref={logoInputRef}
        onChange={handleLogoFileChange}
        accept="image/png,image/svg+xml,image/webp,image/jpeg"
        className="hidden"
      />

      <div className="grid grid-cols-2 gap-2.5">
        {/* Upload Photo Button */}
        <button
          type="button"
          id="upload-photo-btn"
          onClick={() => photoInputRef.current?.click()}
          className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#1a1c21] hover:bg-[#232730] border border-[#2f343e] hover:border-[#d4af37]/50 text-[#f4f3ef] font-medium text-xs transition-all cursor-pointer shadow-sm active:scale-[0.98]"
        >
          <Upload className="w-4 h-4 text-[#d4af37]" />
          <div className="flex flex-col text-left">
            <span className="font-semibold leading-tight">UPLOAD PHOTO</span>
            <span className="text-[10px] text-[#9ba1a6] leading-none mt-0.5 truncate max-w-[120px]">
              {photo ? photo.name : '4:5 Photograph'}
            </span>
          </div>
        </button>

        {/* Upload Logo Button */}
        <div className="relative">
          <button
            type="button"
            id="upload-logo-btn"
            onClick={() => logoInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#1a1c21] hover:bg-[#232730] border border-[#2f343e] hover:border-[#d4af37]/50 text-[#f4f3ef] font-medium text-xs transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <ImageIcon className="w-4 h-4 text-[#d4af37]" />
            <div className="flex flex-col text-left">
              <span className="font-semibold leading-tight">UPLOAD LOGO</span>
              <span className="text-[10px] text-[#9ba1a6] leading-none mt-0.5 truncate max-w-[100px]">
                {logo ? logo.name : 'PNG / SVG with Alpha'}
              </span>
            </div>
          </button>

          {logo && onRemoveLogo && (
            <button
              type="button"
              id="remove-logo-btn"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveLogo();
              }}
              title="Remove Logo"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#2a2e38] hover:bg-red-500/80 text-[#9ba1a6] hover:text-white border border-[#3e4452] flex items-center justify-center transition-colors cursor-pointer text-[10px]"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
