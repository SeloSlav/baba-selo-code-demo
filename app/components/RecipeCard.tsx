"use client";

import { useState, memo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Recipe } from '../recipe/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical, faHeart } from '@fortawesome/free-solid-svg-icons';

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f6f7f8" offset="0%" />
      <stop stop-color="#edeef1" offset="50%" />
      <stop stop-color="#f6f7f8" offset="100%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f6f7f8" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite" />
</svg>`;

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

interface RecipeCardProps {
  recipe: Recipe;
  onLike?: (recipe: Recipe) => void;
  currentUser?: any;
  showUsername?: boolean;
  showMenu?: boolean;
  onMenuClick?: (recipeId: string) => void;
  isMenuOpen?: boolean;
}

export const RecipeCard = memo(function RecipeCard({ 
  recipe, 
  onLike, 
  currentUser, 
  showUsername = false,
  showMenu = false,
  onMenuClick,
  isMenuOpen = false
}: RecipeCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(true);

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      <Link href={`/recipe/${recipe.id}`}>
        <div className="relative h-48">
          {recipe.imageURL && !imageError ? (
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
              blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(400, 225))}`}
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
              <span className="text-4xl">🍳</span>
            </div>
          )}
        </div>
      </Link>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <Link href={`/recipe/${recipe.id}`}>
              <h2 className="text-xl font-semibold line-clamp-1">
                {recipe.recipeTitle}
              </h2>
            </Link>
            {showUsername && (
              <p className="text-sm text-gray-600 mb-2">
                by{' '}
                {recipe.username && recipe.username !== 'Anonymous Chef' ? (
                  <Link href={`/${recipe.username}`} className="hover:underline">
                    {recipe.username}
                  </Link>
                ) : (
                  'Anonymous Chef'
                )}
              </p>
            )}
            {recipe.recipeSummary && (
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">
                {recipe.recipeSummary}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {onLike && (
              <button
                onClick={() => onLike(recipe)}
                className={`p-2 rounded-full transition-colors ${
                  recipe.likes?.includes(currentUser?.uid || '')
                    ? 'text-red-500 hover:bg-red-50'
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                <FontAwesomeIcon icon={faHeart} />
                <span className="ml-1 text-sm">{recipe.likes?.length || 0}</span>
              </button>
            )}
            {showMenu && onMenuClick && !isMenuOpen && (
              <button
                data-menu-button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onMenuClick(recipe.id);
                }}
                className="relative p-1.5 rounded-full hover:bg-gray-100 transition-colors z-50 pointer-events-auto"
              >
                <FontAwesomeIcon 
                  icon={faEllipsisVertical}
                  className="w-4 h-4 text-gray-400"
                />
              </button>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {recipe.diet && recipe.diet.length > 0 && (
            <div className="flex items-center bg-gray-100 border border-gray-300 shadow-sm rounded-full px-3 py-1.5 text-sm">
              <span className="font-semibold mr-2">🍲</span>
              <span>{recipe.diet.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(", ")}</span>
            </div>
          )}
          {recipe.cuisineType && (
            <div className="flex items-center bg-gray-100 border border-gray-300 shadow-sm rounded-full px-3 py-1.5 text-sm">
              <span className="font-semibold mr-2">🍽️</span>
              <span>{recipe.cuisineType}</span>
            </div>
          )}
          {recipe.cookingTime && (
            <div className="flex items-center bg-gray-100 border border-gray-300 shadow-sm rounded-full px-3 py-1.5 text-sm">
              <span className="font-semibold mr-2">⏲️</span>
              <span>{recipe.cookingTime}</span>
            </div>
          )}
          {recipe.cookingDifficulty && (
            <div className="flex items-center bg-gray-100 border border-gray-300 shadow-sm rounded-full px-3 py-1.5 text-sm">
              <span className="font-semibold mr-2">🧩</span>
              <span>{recipe.cookingDifficulty.charAt(0).toUpperCase() + recipe.cookingDifficulty.slice(1).toLowerCase()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}); 