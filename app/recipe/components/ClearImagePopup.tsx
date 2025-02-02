"use client";

import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTimes, faTrashAlt } from "@fortawesome/free-solid-svg-icons";

interface ClearImagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  recipeTitle: string;
}

export const ClearImagePopup: React.FC<ClearImagePopupProps> = ({
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
            <div className="p-2 bg-red-100 rounded-xl">
              <FontAwesomeIcon icon={faTrashAlt} className="text-xl text-red-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Clear Recipe Image</h2>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
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
            Are you sure you want to remove the image from <span className="font-semibold">"{recipeTitle}"</span>?
          </p>
          <p className="text-sm text-gray-500 mt-2">
            The image will be permanently deleted from your recipe and cannot be recovered.
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
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faTrashAlt} />
            Clear Image
          </button>
        </div>
      </div>
    </div>
  );
}; 
