"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faImage } from "@fortawesome/free-solid-svg-icons";

interface RegenerateImagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recipeTitle: string;
}

export const RegenerateImagePopup: React.FC<RegenerateImagePopupProps> = ({
  isOpen,
  onClose,
  onConfirm,
  recipeTitle,
}) => {
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
              <FontAwesomeIcon icon={faImage} className="text-xl text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Regenerate Image</h2>
              <p className="text-sm text-gray-600">This will replace the current image</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-xl" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-6">
          <p className="text-gray-700">
            Are you sure you want to regenerate the image for <span className="font-semibold">"{recipeTitle}"</span>?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            A new AI-generated image will be created based on your recipe. The current image will be permanently replaced.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faImage} />
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}; 
