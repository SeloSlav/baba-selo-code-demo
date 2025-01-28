"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCamera, faCircleInfo, faUpload } from "@fortawesome/free-solid-svg-icons";
import Image from "next/image";

interface ImageUploadPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (file: File | null) => void;
}

// Increase to 10MB to handle typical mobile phone camera images
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export const ImageUploadPopup: React.FC<ImageUploadPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)} MB`);
      return false;
    }
    setError("");
    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (validateFile(file)) {
      setSelectedFile(file);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file) return;
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    },
    []
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleSubmit = () => {
    onSubmit(selectedFile);
    setSelectedFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <FontAwesomeIcon icon={faCamera} className="text-xl text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Share Your Dish</h2>
              <p className="text-sm text-gray-600">Let Baba see what you're cooking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Upload Area */}
        {!previewUrl ? (
          <div className="mb-6">
            {/* Camera and Upload Options */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {/* Take Photo Option */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <FontAwesomeIcon icon={faCamera} className="text-3xl text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 font-medium">Take a Photo</p>
                <p className="text-xs text-gray-400 mt-1">Use your camera</p>
                <input
                  type="file"
                  ref={cameraInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                />
              </button>

              {/* Upload Option */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <FontAwesomeIcon icon={faUpload} className="text-3xl text-gray-400 mb-3" />
                <p className="text-sm text-gray-600 font-medium">Upload Photo</p>
                <p className="text-xs text-gray-400 mt-1">From your device</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="relative border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <div className="absolute top-3 right-3 group">
                <FontAwesomeIcon 
                  icon={faCircleInfo} 
                  className="text-gray-400 hover:text-gray-600 text-sm cursor-help"
                />
                <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute right-0 bottom-full mb-2 w-64 p-3 bg-black text-white text-xs rounded-xl shadow-lg z-50">
                  <div className="relative">
                    Upload any image:
                    <ul className="mt-2 ml-2 space-y-1.5">
                      <li>• Your fridge contents</li>
                      <li>• Ingredients you have</li>
                      <li>• A dish you made</li>
                      <li>• Recipe inspiration</li>
                      <li>• Your grandson</li>
                    </ul>
                    <div className="absolute -bottom-1 right-3 translate-y-full w-2 h-2 bg-black rotate-45"></div>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mb-2">
                Or drag & drop your image here
              </p>
              <p className="text-xs text-gray-400">
                JPG, PNG, or GIF • Max {MAX_FILE_SIZE / (1024 * 1024)} MB
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-6 relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto rounded-xl"
            />
            <button
              type="button"
              className="absolute top-2 right-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
              onClick={() => setSelectedFile(null)}
            >
              <FontAwesomeIcon icon={faTimes} className="text-gray-600" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile}
            className={`px-6 py-2 rounded-lg transition-colors flex items-center gap-2
              ${!selectedFile 
                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                : "bg-black text-white hover:bg-gray-800"}`}
          >
            <FontAwesomeIcon icon={faCamera} />
            {selectedFile ? "Share with Baba" : "Select an Image"}
          </button>
        </div>
      </div>
    </div>
  );
};
