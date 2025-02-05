"use client";

import { useEffect, useState } from 'react';
import { db } from '../firebase/firebase';
import { collection, query, orderBy, getDocs, doc, updateDoc, arrayUnion, arrayRemove, Timestamp } from 'firebase/firestore';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faHeart } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { usePoints } from '../context/PointsContext';
import { Recipe } from '../recipe/types';
import Link from 'next/link';
import Image from 'next/image';
import { SearchBar } from '../components/SearchBar';
import { RecipeCard } from '../components/RecipeCard';

const POINTS_FOR_LIKE = 5; // Points awarded when someone likes your recipe

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

export default function ExplorePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showPointsToast } = usePoints();

  const isRecipeComplete = (recipe: Recipe) => {
    return recipe.recipeSummary && 
           recipe.macroInfo && 
           recipe.dishPairings && 
           recipe.imageURL;
  };

  const fetchRecipes = async () => {
    try {
      setLoading(true);
      const recipesQuery = query(
        collection(db, "recipes"),
        orderBy("lastPinnedAt", "desc")
      );
      const recipeDocs = await getDocs(recipesQuery);
      
      // Get all user documents to map usernames
      const usersQuery = query(collection(db, "users"));
      const userDocs = await getDocs(usersQuery);
      const userMap = new Map();
      userDocs.docs.forEach(doc => {
        userMap.set(doc.id, doc.data().username);
      });

      const allRecipes = recipeDocs.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          username: userMap.get(doc.data().userId)
        })) as Recipe[];

      // Filter for completed recipes only
      const completedRecipes = allRecipes.filter(isRecipeComplete);
      setRecipes(completedRecipes);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const handleLike = async (recipe: Recipe) => {
    if (!user) return;

    try {
      const recipeRef = doc(db, "recipes", recipe.id);
      const currentLikes = recipe.likes || [];
      const hasLiked = currentLikes.includes(user.uid);
      
      if (hasLiked) {
        // Unlike
        await updateDoc(recipeRef, {
          likes: arrayRemove(user.uid)
        });
        setRecipes(prev => prev.map(r => 
          r.id === recipe.id 
            ? { ...r, likes: r.likes?.filter(id => id !== user.uid) }
            : r
        ));
      } else {
        // Like
        await updateDoc(recipeRef, {
          likes: arrayUnion(user.uid)
        });
        setRecipes(prev => prev.map(r => 
          r.id === recipe.id 
            ? { ...r, likes: [...(r.likes || []), user.uid] }
            : r
        ));

        // Add points and transaction record for the recipe owner
        if (recipe.userId !== user.uid) {
          const spoonRef = doc(db, "spoonPoints", recipe.userId);
          await updateDoc(spoonRef, {
            points: POINTS_FOR_LIKE,
            transactions: arrayUnion({
              type: "like",
              points: POINTS_FOR_LIKE,
              timestamp: Timestamp.now(),
              description: `${user.displayName || 'Someone'} liked your recipe "${recipe.recipeTitle}"`,
              recipeId: recipe.id
            })
          });

          // Show points toast to the recipe owner
          showPointsToast(POINTS_FOR_LIKE, "Someone liked your recipe!");
        }
      }
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const searchRecipes = (term: string) => {
    const searchTerms = term.toLowerCase().split(" ");
    return recipes.filter((recipe) => {
      const searchableFields = [
        recipe.recipeTitle?.toLowerCase() || "",
        recipe.username?.toLowerCase() || "",
        recipe.cuisineType?.toLowerCase() || "",
        recipe.cookingDifficulty?.toLowerCase() || "",
        recipe.cookingTime?.toLowerCase() || "",
        recipe.recipeSummary?.toLowerCase() || "",
        ...(recipe.diet?.map(d => d.toLowerCase()) || []),
        ...(recipe.ingredients?.map(i => i.toLowerCase()) || []),
      ];

      return searchTerms.every((term) =>
        searchableFields.some((field) => field.includes(term))
      );
    });
  };

  const filteredRecipes = searchTerm ? searchRecipes(searchTerm) : recipes;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Explore Recipes</h1>
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="animate-pulse">
              <div className="bg-gray-200 h-48 rounded-xl mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe}
              onLike={handleLike}
              currentUser={user}
              showUsername={true}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-4xl mb-4">🤔</div>
          <h3 className="text-xl font-semibold mb-2">No recipes found</h3>
          <p className="text-gray-600">
            Try adjusting your search or check back later for new recipes
          </p>
        </div>
      )}
    </div>
  );
} 