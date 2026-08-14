import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, Check, Trash2, Camera } from 'lucide-react';
import { cn } from '../utils/cn';

interface ImageCropperProps {
  currentImageUrl?: string;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  aspectRatio?: number;
  circularCrop?: boolean;
  title?: string;
  className?: string;
}

export default function ImageCropper({
  currentImageUrl,
  onUpload,
  onRemove,
  aspectRatio = 1,
  circularCrop = true,
  title = 'Upload Image',
  className
}: ImageCropperProps) {
  const [src, setSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isUploading, setIsUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  });

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop(
        { unit: '%', width: 90 },
        aspectRatio,
        width,
        height
      ),
      width,
      height
    );
    setCrop(crop);
  };

  const generateCroppedImage = async () => {
    if (!completedCrop || !imgRef.current) return;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise<File>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        resolve(new File([blob], 'avatar.jpg', { type: 'image/jpeg' }));
      }, 'image/jpeg', 0.95);
    });
  };

  const handleSave = async () => {
    try {
      setIsUploading(true);
      const file = await generateCroppedImage();
      if (file) {
        await onUpload(file);
        setSrc('');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = async () => {
    if (onRemove && confirm('Are you sure you want to remove this image?')) {
      try {
        setIsUploading(true);
        await onRemove();
      } catch (error) {
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <h3 className="text-sm font-medium text-gray-700 mb-4">{title}</h3>
      
      {!src ? (
        <div className="flex flex-col items-center relative group">
          <div 
            {...getRootProps()} 
            className={cn(
              "flex items-center justify-center border-2 border-dashed cursor-pointer bg-gray-50 transition-all overflow-hidden relative",
              isDragActive ? "border-primary bg-primary/5" : "border-gray-300 hover:border-gray-400",
              circularCrop ? "rounded-full w-32 h-32" : "rounded-xl w-96 h-32"
            )}
          >
            <input {...getInputProps()} />
            {currentImageUrl ? (
              <>
                <img src={currentImageUrl} alt="Current" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-10">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <UploadCloud className="w-8 h-8 mb-1" />
                <span className="text-xs font-medium">Upload</span>
              </div>
            )}
          </div>
          
          {currentImageUrl && onRemove && (
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemove();
              }}
              disabled={isUploading}
              className="mt-3 text-xs text-red-500 hover:text-red-600 font-medium flex items-center"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Remove
            </button>
          )}
        </div>
      ) : (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl overflow-hidden max-w-lg w-full">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Crop Image</h3>
              <button onClick={() => setSrc('')} className="p-1 text-gray-400 hover:bg-gray-100 rounded-md">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 bg-gray-50 flex justify-center max-h-[60vh] overflow-y-auto">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
                circularCrop={circularCrop}
              >
                <img ref={imgRef} alt="Crop me" src={src} onLoad={onImageLoad} className="max-w-full" />
              </ReactCrop>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end space-x-3">
              <button 
                onClick={() => setSrc('')}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={isUploading}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors flex items-center"
              >
                {isUploading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Save Crop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
