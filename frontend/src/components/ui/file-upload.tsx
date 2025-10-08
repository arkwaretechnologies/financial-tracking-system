'use client';

import React, { useState, useRef } from 'react';
import { Button } from './button';
import { Camera, Upload, X } from 'lucide-react';
import Image from 'next/image';

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  previewUrl?: string | null;
}

export function FileUpload({ onFileChange, previewUrl: initialPreviewUrl }: FileUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      onFileChange(file);
    }
  };

  const handleCameraCapture = () => {
    if (fileInputRef.current) {
      // Set the input to capture with camera
      fileInputRef.current.setAttribute('capture', 'environment');
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = () => {
    if (fileInputRef.current) {
      // Remove capture attribute to allow regular file selection
      fileInputRef.current.removeAttribute('capture');
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = () => {
    setPreviewUrl(null);
    onFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      {previewUrl ? (
        <div className="relative">
          <Image 
            src={previewUrl} 
            alt="Document preview" 
            width={200}
            height={200}
            className="max-h-48 rounded-md object-contain border border-gray-200"
          />
          <button
            type="button"
            onClick={handleRemoveFile}
            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCameraCapture}
            className="flex-1"
          >
            <Camera className="h-4 w-4 mr-2" />
            Capture Photo
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => handleFileUpload()}
            className="flex-1"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload File
          </Button>
        </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        capture="environment"
      />
    </div>
  );
}