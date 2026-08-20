import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Upload, Check, ImageIcon } from 'lucide-react';
import { InspectionData } from '../../pages/backoffice/backofficeTypes';
import { getAllPropertyPhotos, PhotoInfo } from '../../utils/photoUtils';

interface GlobalPhotoSelectorModalProps {
  isOpen: boolean;
  title?: string;
  categoryName?: string;
  data: InspectionData;
  onClose: () => void;
  onSelect: (dataUrls: string[]) => void;
  onUpload?: (capture: boolean) => void;
  initialPhotoUrls?: string[];
}

export const GlobalPhotoSelectorModal: React.FC<GlobalPhotoSelectorModalProps> = ({
  isOpen,
  title = 'Media Bibliotheek',
  categoryName,
  data,
  onClose,
  onSelect,
  onUpload,
  initialPhotoUrls = []
}) => {
  const [photos, setPhotos] = useState<PhotoInfo[]>([]);
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = (capture: boolean) => {
    if (fileInputRef.current) {
      if (capture) {
        fileInputRef.current.setAttribute('capture', 'environment');
      } else {
        fileInputRef.current.removeAttribute('capture');
      }
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 1200;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);

        const newPhoto = { dataUrl, source: 'Nieuwe upload', type: 'image' } as PhotoInfo;
        setPhotos(prev => [newPhoto, ...prev]);
        setSelectedUrls(prev => [...prev, dataUrl]);
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPhotos(getAllPropertyPhotos(data));
      setSelectedUrls(initialPhotoUrls);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const formattedTitle = React.useMemo(() => {
    if (categoryName) {
      return `MEDIA BIBLIOTHEEK (${categoryName.toUpperCase()})`;
    }
    if (title && title !== 'Media Bibliotheek') {
      const cleanedTitle = title.replace(/^MEDIA BIBLIOTHEEK\s*/i, '').replace(/[()]/g, '').trim();
      return cleanedTitle ? `MEDIA BIBLIOTHEEK (${cleanedTitle.toUpperCase()})` : 'MEDIA BIBLIOTHEEK';
    }
    return 'MEDIA BIBLIOTHEEK';
  }, [title, categoryName]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[9999] p-4 no-print">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-outline-variant/10 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex justify-between items-center px-6 py-4 border-b border-outline-variant/10">
          <h3 className="text-sm font-black text-[#191c1d] uppercase tracking-wider font-sans">
            {formattedTitle}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant/60 hover:text-on-surface-variant bg-neutral-100 hover:bg-neutral-200 rounded-full p-1.5 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-neutral-50/50">
          {photos.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center p-8 bg-neutral-50 rounded-2xl border border-dashed border-outline-variant/15 text-on-surface-variant/40 gap-2 h-full">
              <ImageIcon size={32} className="stroke-[1.5]" />
              <p className="text-xs font-bold">Nog geen foto's geüpload voor dit project</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {photos.map((photo, idx) => {
                const isSelected = selectedUrls.includes(photo.dataUrl);
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedUrls(prev => 
                        prev.includes(photo.dataUrl)
                          ? prev.filter(url => url !== photo.dataUrl)
                          : [...prev, photo.dataUrl]
                      );
                    }}
                    className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-2 transition-all ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20 shadow-md'
                        : 'border-outline-variant/10 hover:border-primary/50'
                    }`}
                  >
                    <img src={photo.dataUrl} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    {isSelected && (
                      <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white shadow-md">
                          <Check size={14} className="stroke-[3]" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-black/40 text-white text-[8px] p-1 truncate text-center backdrop-blur-sm">
                      {photo.source}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-outline-variant/10 bg-white">
          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleUploadClick(true)}
              className="py-3 bg-neutral-100 hover:bg-neutral-200 text-slate-700 rounded-xl font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
              title="Camera"
            >
              <Camera size={18} />
              <span className="text-[9px] uppercase tracking-wider">Camera</span>
            </button>
            <button
              type="button"
              onClick={() => handleUploadClick(false)}
              className="py-3 bg-neutral-100 hover:bg-neutral-200 text-slate-700 rounded-xl font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors"
              title="Upload vanaf PC"
            >
              <Upload size={18} />
              <span className="text-[9px] uppercase tracking-wider">Upload</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onSelect(selectedUrls);
                onClose();
              }}
              className="py-3 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
              title="Klaar"
            >
              <Check size={18} />
              <span className="text-[9px] uppercase tracking-wider">Klaar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

