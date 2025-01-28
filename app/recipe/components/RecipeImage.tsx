"use client";

import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faUpload } from "@fortawesome/free-solid-svg-icons";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { Recipe } from "../types";

interface RecipeImageProps {
  recipe: Recipe;
  isOwner: boolean;
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
  return (
    <div className="relative aspect-video w-full mb-6 bg-gray-100 rounded-lg overflow-hidden group">
      {recipe.imageURL && !imageError ? (
        <>
          <Image
            src={recipe.imageURL}
            alt={recipe.recipeTitle}
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
          {isOwner && (
            <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-4">
              <button
                onClick={handleGenerateImage}
                disabled={loadingImage}
                className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loadingImage ? (
                  <div className="flex items-center">
                    <LoadingSpinner className="mr-2" />
                    Regenerating...
                  </div>
                ) : (
                  'Regenerate Image'
                )}
              </button>
              <button
                onClick={handleDeleteImage}
                className="bg-red-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-red-700 transition-all duration-200"
              >
                <FontAwesomeIcon icon={faTrash} className="mr-2" />
                Clear Image
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <span className="text-6xl">🍳</span>
          {isOwner && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-4">
              <button
                onClick={handleGenerateImage}
                disabled={loadingImage}
                className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loadingImage ? (
                  <div className="flex items-center">
                    <LoadingSpinner className="mr-2" />
                    Generating...
                  </div>
                ) : (
                  'Generate Image'
                )}
              </button>
              <label className="bg-white text-gray-800 px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 cursor-pointer transition-all duration-200 flex items-center">
                <FontAwesomeIcon icon={faUpload} className="mr-2" />
                {uploadingImage ? (
                  <div className="flex items-center">
                    <LoadingSpinner className="mr-2" />
                    Uploading...
                  </div>
                ) : (
                  'Upload Image'
                )}
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
    </div>
  );
}; 