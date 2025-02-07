import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, orderBy, limit, startAfter, where, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Recipe } from '../../recipe/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faArrowRight, faArrowLeft, faFilter, faSearch, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { LoadingSpinner } from '../../components/LoadingSpinner';

// Custom scrollbar styles
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 4px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #555;
  }
`;

interface RecipeModernizerProps {
  showPointsToast: (points: number, message: string) => void;
}

const RecipeModernizer: React.FC<RecipeModernizerProps> = ({ showPointsToast }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [modernizingId, setModernizingId] = useState<string | null>(null);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const BATCH_SIZE = 10;

  // Function to check if a recipe needs modernization
  const needsModernization = (recipe: Recipe) => {
    return !recipe.ingredients?.length || 
           !recipe.directions?.length || 
           !recipe.recipeSummary || 
           !recipe.macroInfo || 
           !recipe.dishPairings;
  };

  // Function to fetch total count
  const fetchTotalCount = async () => {
    try {
      const snapshot = await getDocs(query(
        collection(db, 'recipes'),
        where('directions', 'not-in', [[]])
      ));
      setTotalRecipes(snapshot.size);
    } catch (error) {
      console.error('Error fetching total count:', error);
    }
  };

  // Function to fetch recipes
  const fetchRecipes = async (isNewQuery: boolean = true) => {
    try {
      setLoading(true);
      
      // Query for recipes where directions doesn't exist
      let recipesQuery = query(
        collection(db, 'recipes'),
        where('directions', 'not-in', [[]]),
        orderBy('createdAt', 'asc'),
        limit(BATCH_SIZE)
      );

      if (!isNewQuery && lastDoc) {
        recipesQuery = query(
          collection(db, 'recipes'),
          where('directions', 'not-in', [[]]),
          orderBy('createdAt', 'asc'),
          startAfter(lastDoc),
          limit(BATCH_SIZE)
        );
      }

      const recipeDocs = await getDocs(recipesQuery);
      
      const newRecipes = recipeDocs.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as Recipe[];

      setLastDoc(recipeDocs.docs[recipeDocs.docs.length - 1]);
      setHasMore(recipeDocs.docs.length === BATCH_SIZE);

      // Update the recipes state
      if (isNewQuery) {
        setRecipes(newRecipes);
      } else {
        setRecipes(prev => [...prev, ...newRecipes]);
      }

    } catch (error) {
      console.error('Error fetching recipes:', error);
      showPointsToast(0, 'Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  // Function to modernize a recipe
  const modernizeRecipe = async (recipe: Recipe) => {
    try {
      setModernizingId(recipe.id);
      let updatedRecipe = { ...recipe };

      // First, generate recipe details
      const detailsResponse = await fetch("/api/generateRecipeDetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeTitle: updatedRecipe.recipeTitle,
          recipeContent: updatedRecipe.recipeContent,
          generateAll: true
        }),
      });

      let detailsData;
      try {
        detailsData = await detailsResponse.json();
      } catch (e) {
        throw new Error('Failed to parse API response: Invalid JSON');
      }

      if (!detailsResponse.ok) {
        const errorMessage = detailsData?.message || detailsData?.error || 'Failed to generate recipe details';
        throw new Error(errorMessage);
      }

      if (!detailsData || typeof detailsData !== 'object') {
        throw new Error('Invalid API response format');
      }

      // Check if we have the basic recipe details
      if (!Array.isArray(detailsData.ingredients) || !detailsData.ingredients.length ||
          !Array.isArray(detailsData.directions) || !detailsData.directions.length) {
        throw new Error('Failed to generate recipe ingredients and directions');
      }
      
      // Update recipe with all generated data, using fallbacks for missing data
      updatedRecipe = {
        ...updatedRecipe,
        ingredients: detailsData.ingredients,
        directions: detailsData.directions,
        recipeSummary: detailsData.summary || updatedRecipe.recipeSummary || '',
        macroInfo: detailsData.macroInfo || updatedRecipe.macroInfo,
        dishPairings: detailsData.dishPairings || updatedRecipe.dishPairings,
        cookingTime: detailsData.cookingTime || updatedRecipe.cookingTime || 0,
        cuisineType: detailsData.cuisineType || updatedRecipe.cuisineType || 'unknown',
        cookingDifficulty: detailsData.cookingDifficulty || updatedRecipe.cookingDifficulty || 'medium',
        diet: Array.isArray(detailsData.diet) ? detailsData.diet : updatedRecipe.diet || []
      };

      // Update the recipe in Firestore
      const recipeRef = doc(db, 'recipes', updatedRecipe.id);
      await updateDoc(recipeRef, {
        ingredients: updatedRecipe.ingredients,
        directions: updatedRecipe.directions,
        recipeSummary: updatedRecipe.recipeSummary,
        macroInfo: updatedRecipe.macroInfo,
        dishPairings: updatedRecipe.dishPairings,
        cookingTime: updatedRecipe.cookingTime,
        cuisineType: updatedRecipe.cuisineType,
        cookingDifficulty: updatedRecipe.cookingDifficulty,
        diet: updatedRecipe.diet
      });

      // Update local state
      setRecipes(prev => prev.map(r => r.id === updatedRecipe.id ? updatedRecipe : r));
      
      // Show success message with details about what was updated
      const updatedFields = [];
      if (detailsData.ingredients?.length) updatedFields.push('ingredients');
      if (detailsData.directions?.length) updatedFields.push('directions');
      if (detailsData.summary) updatedFields.push('summary');
      if (detailsData.macroInfo) updatedFields.push('nutritional info');
      if (detailsData.dishPairings) updatedFields.push('pairings');
      if (detailsData.cookingTime) updatedFields.push('cooking time');
      if (detailsData.cuisineType) updatedFields.push('cuisine');
      if (detailsData.cookingDifficulty) updatedFields.push('difficulty');
      if (detailsData.diet?.length) updatedFields.push('dietary info');
      
      showPointsToast(0, `Updated ${updatedRecipe.recipeTitle} with: ${updatedFields.join(', ')}`);
    } catch (error) {
      console.error('Error modernizing recipe:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      showPointsToast(0, `Failed to modernize recipe: ${errorMessage}`);
    } finally {
      setModernizingId(null);
    }
  };

  // Add these new functions for individual updates
  const generateBasicDetails = async (recipe: Recipe) => {
    try {
      setModernizingId(recipe.id);
      const response = await fetch("/api/generateRecipeDetails", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipeTitle: recipe.recipeTitle,
          recipeContent: recipe.recipeContent,
          generateAll: false
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate recipe details');
      }

      const updatedRecipe = {
        ...recipe,
        ingredients: data.ingredients || recipe.ingredients,
        directions: data.directions || recipe.directions
      };

      await updateDoc(doc(db, 'recipes', recipe.id), {
        ingredients: updatedRecipe.ingredients,
        directions: updatedRecipe.directions
      });

      setRecipes(prev => prev.map(r => r.id === recipe.id ? updatedRecipe : r));
      showPointsToast(0, `Updated basic details for ${recipe.recipeTitle}`);
    } catch (error) {
      console.error('Error generating details:', error);
      showPointsToast(0, `Failed to generate details: ${error.message}`);
    } finally {
      setModernizingId(null);
    }
  };

  const generateClassification = async (recipe: Recipe) => {
    try {
      setModernizingId(recipe.id);
      const response = await fetch("/api/classifyRecipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `${recipe.recipeTitle}\n\nIngredients:\n${recipe.ingredients.join('\n')}\n\nDirections:\n${recipe.directions.join('\n')}`
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate classification');
      }

      // Convert cooking_time to minutes for internal processing
      let minutes = 30; // default fallback
      if (typeof data.cooking_time === 'number') {
        minutes = data.cooking_time;
      } else if (typeof data.cooking_time === 'string') {
        // Handle string formats
        const timeString = data.cooking_time.toLowerCase();
        if (timeString.includes('hour')) {
          const hours = parseInt(timeString) || 1;
          minutes = hours * 60;
        } else if (timeString.includes('minute')) {
          minutes = parseInt(timeString) || 30;
        } else {
          // Try to parse just the number
          const number = parseInt(timeString);
          if (!isNaN(number)) {
            minutes = number;
          }
        }
      }

      // Convert minutes back to a formatted string
      let cookingTime: string;
      if (minutes >= 120) {
        cookingTime = '2 hours';
      } else if (minutes >= 60) {
        cookingTime = '1 hour';
      } else {
        cookingTime = `${minutes} minutes`;
      }

      const updatedRecipe = {
        ...recipe,
        cookingTime,
        cuisineType: data.cuisine,
        cookingDifficulty: data.difficulty,
        diet: data.diet || []
      };

      await updateDoc(doc(db, 'recipes', recipe.id), {
        cookingTime,
        cuisineType: data.cuisine,
        cookingDifficulty: data.difficulty,
        diet: data.diet || []
      });

      setRecipes(prev => prev.map(r => r.id === recipe.id ? updatedRecipe : r));
      showPointsToast(0, `Generated classification for ${recipe.recipeTitle}`);
    } catch (error) {
      console.error('Error generating classification:', error);
      showPointsToast(0, `Failed to generate classification: ${error.message}`);
    } finally {
      setModernizingId(null);
    }
  };

  const generateSummary = async (recipe: Recipe) => {
    try {
      setModernizingId(recipe.id);
      const response = await fetch("/api/generateSummary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: recipe.recipeTitle,
          ingredients: recipe.ingredients,
          directions: recipe.directions,
          cuisineType: recipe.cuisineType,
          diet: recipe.diet,
          cookingTime: recipe.cookingTime,
          cookingDifficulty: recipe.cookingDifficulty
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate summary');
      }

      const updatedRecipe = {
        ...recipe,
        recipeSummary: data.summary
      };

      await updateDoc(doc(db, 'recipes', recipe.id), {
        recipeSummary: data.summary
      });

      setRecipes(prev => prev.map(r => r.id === recipe.id ? updatedRecipe : r));
      showPointsToast(0, `Generated summary for ${recipe.recipeTitle}`);
    } catch (error) {
      console.error('Error generating summary:', error);
      showPointsToast(0, `Failed to generate summary: ${error.message}`);
    } finally {
      setModernizingId(null);
    }
  };

  const generateMacroInfo = async (recipe: Recipe) => {
    try {
      setModernizingId(recipe.id);
      const response = await fetch("/api/macroInfo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe: `${recipe.recipeTitle}\n\nIngredients:\n${recipe.ingredients.join('\n')}\n\nDirections:\n${recipe.directions.join('\n')}`
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate macro info');
      }

      const updatedRecipe = {
        ...recipe,
        macroInfo: data.macros
      };

      await updateDoc(doc(db, 'recipes', recipe.id), {
        macroInfo: data.macros
      });

      setRecipes(prev => prev.map(r => r.id === recipe.id ? updatedRecipe : r));
      showPointsToast(0, `Generated macro info for ${recipe.recipeTitle}`);
    } catch (error) {
      console.error('Error generating macro info:', error);
      showPointsToast(0, `Failed to generate macro info: ${error.message}`);
    } finally {
      setModernizingId(null);
    }
  };

  const generatePairings = async (recipe: Recipe) => {
    try {
      setModernizingId(recipe.id);
      const response = await fetch("/api/dishPairing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe: `${recipe.recipeTitle}\n\nIngredients:\n${recipe.ingredients.join('\n')}\n\nDirections:\n${recipe.directions.join('\n')}`
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate pairings');
      }

      const updatedRecipe = {
        ...recipe,
        dishPairings: data.suggestion
      };

      await updateDoc(doc(db, 'recipes', recipe.id), {
        dishPairings: data.suggestion
      });

      setRecipes(prev => prev.map(r => r.id === recipe.id ? updatedRecipe : r));
      showPointsToast(0, `Generated pairings for ${recipe.recipeTitle}`);
    } catch (error) {
      console.error('Error generating pairings:', error);
      showPointsToast(0, `Failed to generate pairings: ${error.message}`);
    } finally {
      setModernizingId(null);
    }
  };

  // Add delete recipe function
  const handleDeleteRecipe = async (recipeId: string) => {
    if (!window.confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }

    try {
      setDeletingId(recipeId);
      await deleteDoc(doc(db, 'recipes', recipeId));
      setRecipes(prev => prev.filter(r => r.id !== recipeId));
      setTotalRecipes(prev => prev - 1);
      showPointsToast(0, 'Recipe deleted successfully');
    } catch (error) {
      console.error('Error deleting recipe:', error);
      showPointsToast(0, 'Failed to delete recipe');
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchRecipes();
    fetchTotalCount(); // Fetch total count when component mounts
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Recipe Modernizer</h2>
          <p className="text-sm text-gray-600 mt-1">
            Showing {recipes.length} of {totalRecipes} recipes missing directions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              fetchRecipes();
              fetchTotalCount();
            }}
            className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FontAwesomeIcon icon={faSync} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
        <div className="space-y-2">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="border rounded-lg p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <a 
                    href={`/recipe/${recipe.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-800 hover:underline truncate"
                  >
                    {recipe.recipeTitle}
                  </a>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDeleteRecipe(recipe.id)}
                      disabled={deletingId === recipe.id}
                      className={`px-1.5 py-0.5 text-xs rounded transition-colors 
                        ${deletingId === recipe.id 
                          ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-600' 
                          : 'bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer hover:scale-105'
                        }`}
                    >
                      {deletingId === recipe.id ? '...' : '🗑️'}
                    </button>
                    <button
                      onClick={() => generateBasicDetails(recipe)}
                      disabled={modernizingId === recipe.id}
                      className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                        modernizingId === recipe.id 
                          ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-600' 
                          : (!recipe.ingredients?.length || !recipe.directions?.length)
                            ? 'bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer hover:scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer hover:scale-105'
                      }`}
                    >
                      {modernizingId === recipe.id 
                        ? 'Updating...' 
                        : (!recipe.ingredients?.length || !recipe.directions?.length)
                          ? 'No Details'
                          : 'Try Details Again'}
                    </button>

                    <button
                      onClick={() => generateClassification(recipe)}
                      disabled={modernizingId === recipe.id}
                      className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                        modernizingId === recipe.id 
                          ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-600' 
                          : (!recipe.cookingTime || !recipe.cuisineType || !recipe.cookingDifficulty || !recipe.diet)
                            ? 'bg-purple-100 text-purple-600 hover:bg-purple-200 cursor-pointer hover:scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer hover:scale-105'
                      }`}
                    >
                      {modernizingId === recipe.id 
                        ? 'Updating...' 
                        : (!recipe.cookingTime || !recipe.cuisineType || !recipe.cookingDifficulty || !recipe.diet)
                          ? 'No Classification'
                          : 'Try Classification Again'}
                    </button>

                    <button
                      onClick={() => generateSummary(recipe)}
                      disabled={modernizingId === recipe.id}
                      className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                        modernizingId === recipe.id 
                          ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-600' 
                          : !recipe.recipeSummary
                            ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 cursor-pointer hover:scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer hover:scale-105'
                      }`}
                    >
                      {modernizingId === recipe.id 
                        ? 'Updating...' 
                        : !recipe.recipeSummary
                          ? 'No Summary'
                          : 'Try Summary Again'}
                    </button>

                    <button
                      onClick={() => generateMacroInfo(recipe)}
                      disabled={modernizingId === recipe.id}
                      className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                        modernizingId === recipe.id 
                          ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-600' 
                          : !recipe.macroInfo
                            ? 'bg-green-100 text-green-600 hover:bg-green-200 cursor-pointer hover:scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer hover:scale-105'
                      }`}
                    >
                      {modernizingId === recipe.id 
                        ? 'Updating...' 
                        : !recipe.macroInfo
                          ? 'No Nutrition'
                          : 'Try Nutrition Again'}
                    </button>

                    <button
                      onClick={() => generatePairings(recipe)}
                      disabled={modernizingId === recipe.id}
                      className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                        modernizingId === recipe.id 
                          ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-600' 
                          : !recipe.dishPairings
                            ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer hover:scale-105'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer hover:scale-105'
                      }`}
                    >
                      {modernizingId === recipe.id 
                        ? 'Updating...' 
                        : !recipe.dishPairings
                          ? 'No Pairings'
                          : 'Try Pairings Again'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {recipes.length === 0 && !loading && (
            <div className="text-center py-6 text-gray-500 text-sm">
              No recipes found missing directions.
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex justify-center my-4">
          <LoadingSpinner />
        </div>
      )}

      {!loading && hasMore && (
        <div className="flex justify-center mt-4">
          <button
            onClick={() => fetchRecipes(false)}
            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
};

export default RecipeModernizer; 