"use client";

import Head from 'next/head';
import { Recipe } from '../recipe/types';

interface RecipeMetaTagsProps {
  recipe: Recipe;
  defaultImage: string;
}

export const RecipeMetaTags: React.FC<RecipeMetaTagsProps> = ({ recipe, defaultImage }) => {
  const title = `${recipe.recipeTitle} | Baba Selo`;
  const description = recipe.recipeSummary || `A delicious ${recipe.cuisineType} recipe for ${recipe.recipeTitle}`;
  const image = recipe.imageURL || defaultImage;

  return (
    <Head>
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`https://www.babaselo.com/recipe/${recipe.id}`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={`https://www.babaselo.com/recipe/${recipe.id}`} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={image} />

      {/* Additional Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
    </Head>
  );
}; 