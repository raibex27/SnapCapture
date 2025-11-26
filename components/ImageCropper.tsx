
import React, { useRef, useEffect } from 'react';
import { XCircleIcon, SparklesIcon } from './Icons';

declare const Cropper: any;

interface ImageCropperProps {
  imageSrc: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropperRef = useRef<any>(null);

  useEffect(() => {
    if (imageRef.current && typeof Cropper !== 'undefined') {
      cropperRef.current = new Cropper(imageRef.current, {
        viewMode: 1, // Restrict crop box to canvas size
        dragMode: 'move', // Allow moving the image within the container
        initialAspectRatio: NaN, // Free crop
        responsive: true,
        background: false, // Turn off grid background for cleaner look in dark mode
        guides: true,
        autoCropArea: 0.8,
      });
    }

    return () => {
      if (cropperRef.current) {
        cropperRef.current.destroy();
      }
    };
  }, [imageSrc]);

  const handleSave = () => {
    if (cropperRef.current) {
      cropperRef.current.getCroppedCanvas().toBlob((blob: Blob | null) => {
        if (blob) {
          onConfirm(blob);
        }
      }, 'image/png', 1); // High quality PNG
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-grow relative overflow-hidden bg-black rounded-lg shadow-inner border border-gray-700">
        <img
          ref={imageRef}
          src={imageSrc}
          alt="To be cropped"
          className="max-w-full block" // Important for CropperJS to function correctly
          style={{ opacity: 0 }} // Hide original image until cropper loads
        />
      </div>
      
      <div className="flex gap-4 mt-4 shrink-0">
        <button 
          onClick={onCancel} 
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-700 text-white font-medium rounded-lg hover:bg-gray-600 transition-colors"
        >
          <XCircleIcon className="w-5 h-5" />
          Cancel
        </button>
        <button 
          onClick={handleSave} 
          className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/40"
        >
          <SparklesIcon className="w-5 h-5" />
          Done
        </button>
      </div>
    </div>
  );
};
