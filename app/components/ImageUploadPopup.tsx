"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
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
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [error, setError] = useState<string>(""); // For file size or other errors

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Whenever selectedFile changes, attempt to create an object URL for preview
  useEffect(() => {
    if (selectedFile) {
      const fileUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(fileUrl);

      return () => {
        URL.revokeObjectURL(fileUrl);
      };
    } else {
      setPreviewUrl("");
    }
  }, [selectedFile]);

  /** 
   * Validate file size. If invalid, clear it and set an error. Otherwise, accept.
   */
  const validateAndSetFile = (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setError(`File is too large. Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`);
      setSelectedFile(null);
    } else {
      setError("");
      setSelectedFile(file);
    }
  };

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      if (file) validateAndSetFile(file);
    },
    []
  );

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleClick = () => {
    // Programmatically trigger the hidden file input
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    // Clear state and close
    setSelectedFile(null);
    setError("");
    onClose();
  };

  const handleSubmit = () => {
    // If there's an error, let's not submit
    if (error) return;
    // Pass the selected file to the parent callback
    onSubmit(selectedFile);
    // For now, let's also close the popup after submission
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-75 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal Container */}
      <div className="relative z-[10000] w-11/12 max-w-md bg-white rounded-lg shadow-lg p-4">
        {/* Close Icon */}
        <button
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          onClick={handleClose}
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>

        {/* Header with Baba's image */}
        <div className="flex flex-col items-center mb-6">
          <Image 
            src="/baba_no_text.png"
            alt="Baba Selo"
            width={64}
            height={64}
            className="mb-4"
          />
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xl font-semibold">Upload an Image</h2>
            <div className="group relative">
              <FontAwesomeIcon 
                icon={faCircleInfo} 
                className="text-gray-400 hover:text-gray-600 text-sm cursor-help"
              />
              <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-2 bg-black text-white text-xs rounded-lg shadow-lg z-50">
                <div className="relative">
                  Upload any image:
                  <ul className="mt-1 ml-2 space-y-1">
                    <li>• Your fridge contents</li>
                    <li>• Ingredients you have</li>
                    <li>• A dish you made</li>
                    <li>• Recipe inspiration</li>
                    <li>• Your grandson</li>
                  </ul>
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full w-2 h-2 bg-black rotate-45"></div>
                </div>
              </div>
            </div>
          </div>
          <p className="text-gray-600 text-center text-sm">
            Show Baba what you're cooking! She'll tell you if your sarma needs more rolling practice 😉
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 text-red-600 p-2 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Dropzone / Click to Upload */}
        {!previewUrl ? (
          <div
            onClick={handleClick}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-100 cursor-pointer"
          >
            <p className="text-gray-500 mb-2">
              Drag & drop or click to select a file
            </p>
            <p className="text-xs text-gray-400">
              JPG, PNG, or GIF. Max {MAX_FILE_SIZE / (1024 * 1024)} MB
            </p>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>
        ) : (
          // Preview
          <div className="relative">
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full h-auto rounded-lg"
            />
            <button
              type="button"
              className="absolute top-2 right-2 bg-white rounded-full p-1 shadow hover:bg-gray-200"
              onClick={() => setSelectedFile(null)}
            >
              <FontAwesomeIcon icon={faTimes} className="text-gray-600" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleClose}
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded-md mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-md"
            disabled={!!error} // disable if there's an error
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
};
