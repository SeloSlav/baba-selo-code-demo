"use client";

import React, { useState } from 'react';
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUpload } from "@fortawesome/free-solid-svg-icons";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { ActionButton } from "../../components/ActionButton";
import { Recipe } from "../types";
import { RegenerateImagePopup } from "./RegenerateImagePopup";
import { ClearImagePopup } from "./ClearImagePopup";

interface RecipeImageProps {
  recipe: Recipe;
  isOwner: boolean;
  isUserAdmin?: boolean;
  isImageLoading: boolean;
  imageError: boolean;
  loadingImage: boolean;
  uploadingImage: boolean;
  handleGenerateImage: () => void;
  handleDeleteImage: () => void;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setIsImageLoading: (loading: boolean) => void;
  setImageError: (error: boolean) => void;
  shimmer: (w: number, h: number) => string;
  toBase64: (str: string) => string;
}

export const RecipeImage = ({
  recipe,
  isOwner,
  isUserAdmin,
  isImageLoading,
  imageError,
  loadingImage,
  uploadingImage,
  handleGenerateImage,
  handleDeleteImage,
  handleImageUpload,
  setIsImageLoading,
  setImageError,
  shimmer,
  toBase64,
}: RecipeImageProps) => {
  const [showRegeneratePopup, setShowRegeneratePopup] = useState(false);
  const [showClearPopup, setShowClearPopup] = useState(false);

  // Show controls if user is owner OR admin
  const canManageImages = isOwner || isUserAdmin;

  // Cache-bust: use imageUpdatedAt so browser fetches fresh image after regenerate/upload (same storage path = stale cache)
  const displayImageUrl = recipe.imageURL
    ? recipe.imageUpdatedAt
      ? `${recipe.imageURL}${recipe.imageURL.includes('?') ? '&' : '?'}_t=${typeof recipe.imageUpdatedAt === 'object' && recipe.imageUpdatedAt !== null && 'toMillis' in recipe.imageUpdatedAt ? (recipe.imageUpdatedAt as { toMillis: () => number }).toMillis() : recipe.imageUpdatedAt}`
      : recipe.imageURL
    : undefined;

  return (
    <div className="relative aspect-[16/12] sm:aspect-video w-full mb-6 bg-gray-100 rounded-lg overflow-hidden group">
      {displayImageUrl && !imageError ? (
        <>
          <Image
            src={displayImageUrl}
            alt={recipe.recipeTitle || 'Recipe'}
            fill
            className={`object-cover transition-opacity duration-300 ${
              isImageLoading ? 'opacity-0' : 'opacity-100'
            }`}
            onLoad={() => setIsImageLoading(false)}
            onError={() => setImageError(true)}
            placeholder="blur"
            blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(1920, 1080))}`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1000px"
            priority
          />
          {isImageLoading && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse" />
          )}
          {canManageImages && (
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
              <ActionButton
                onClick={() => setShowRegeneratePopup(true)}
                disabled={loadingImage}
                isLoading={loadingImage}
                loadingText="Regenerating..."
                variant="secondary"
              >
                Regenerate Image
              </ActionButton>
              <button
                onClick={() => setShowClearPopup(true)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition-all duration-200"
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Clear Image
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center sm:items-center justify-center bg-gray-100">
          <div className="relative -top-8 sm:top-0">
            <span className="text-6xl">🍳</span>
          </div>
          {canManageImages && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex flex-col sm:flex-row gap-4 w-[90%] sm:w-auto px-4 sm:px-0">
              <ActionButton
                onClick={handleGenerateImage}
                disabled={loadingImage}
                isLoading={loadingImage}
                loadingText="Generating..."
                variant="primary"
                className="w-full sm:w-auto"
              >
                Generate Image 🥄✨
              </ActionButton>
              <label className="relative w-full sm:w-auto">
                <ActionButton
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.preventDefault();
                    const input = e.currentTarget.parentElement?.querySelector<HTMLInputElement>('input[type="file"]');
                    if (input) input.click();
                  }}
                  disabled={uploadingImage}
                  isLoading={uploadingImage}
                  loadingText="Uploading..."
                  variant="secondary"
                  className="w-full sm:w-auto"
                >
                  <FontAwesomeIcon icon={faUpload} className="mr-2" />
                  Upload Image
                </ActionButton>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={uploadingImage}
                />
              </label>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Popups */}
      <RegenerateImagePopup
        isOpen={showRegeneratePopup}
        onClose={() => setShowRegeneratePopup(false)}
        onConfirm={handleGenerateImage}
        recipeTitle={recipe.recipeTitle}
      />

      <ClearImagePopup
        isOpen={showClearPopup}
        onClose={() => setShowClearPopup(false)}
        onConfirm={handleDeleteImage}
        recipeTitle={recipe.recipeTitle}
      />
    </div>
  );
}; 