import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, orderBy, limit, startAfter, where } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { Recipe } from '../../recipe/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSync, faArrowRight, faArrowLeft, faFilter, faSearch } from '@fortawesome/free-solid-svg-icons';
import { LoadingSpinner } from '../../components/LoadingSpinner';

interface RecipeModernizerProps {
  showPointsToast: (points: number, message: string) => void;
}

export const RecipeModernizer: React.FC<RecipeModernizerProps> = ({ showPointsToast }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [modernizing, setModernizing] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'incomplete'>('incomplete');
  const BATCH_SIZE = 10;

  // Function to check if a recipe needs modernization
  const needsModernization = (recipe: Recipe) => {
    return !recipe.ingredients?.length || 
           !recipe.directions?.length || 
           !recipe.recipeSummary || 
           !recipe.macroInfo || 
           !recipe.dishPairings;
  };

  // Function to fetch recipes
  const fetchRecipes = async (isNewQuery: boolean = true) => {
    try {
      setLoading(true);
      let recipesQuery = query(
        collection(db, 'recipes'),
        orderBy('createdAt', 'desc'),
        limit(BATCH_SIZE)
      );

      if (filter === 'incomplete') {
        recipesQuery = query(
          recipesQuery,
          where('ingredients', '==', [])
        );
      }

      if (!isNewQuery && lastDoc) {
        recipesQuery = query(recipesQuery, startAfter(lastDoc));
      }

      const snapshot = await getDocs(recipesQuery);
      const newRecipes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Recipe[];

      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === BATCH_SIZE);

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
      setModernizing(true);

      // Generate missing fields using GPT
      if (!recipe.ingredients?.length || !recipe.directions?.length) {
        const response = await fetch("/api/generateRecipeDetails", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipeTitle: recipe.recipeTitle,
            recipeContent: recipe.recipeContent
          }),
        });

        if (response.ok) {
          const data = await response.json();
          recipe.ingredients = data.ingredients;
          recipe.directions = data.directions;
        }
      }

      // Generate recipe summary if missing
      if (!recipe.recipeSummary) {
        const summaryResponse = await fetch("/api/generateSummary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: recipe.recipeTitle,
            ingredients: recipe.ingredients,
            directions: recipe.directions,
            cuisineType: recipe.cuisineType,
            diet: recipe.diet,
            cookingTime: recipe.cookingTime,
            cookingDifficulty: recipe.cookingDifficulty,
          }),
        });

        if (summaryResponse.ok) {
          const data = await summaryResponse.json();
          recipe.recipeSummary = data.summary;
        }
      }

      // Generate macro information if missing
      if (!recipe.macroInfo) {
        const macroResponse = await fetch("/api/macroInfo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipe: `${recipe.recipeTitle}\nIngredients:\n${recipe.ingredients.join("\n")}\nDirections:\n${recipe.directions.join("\n")}`,
          }),
        });

        if (macroResponse.ok) {
          const data = await macroResponse.json();
          recipe.macroInfo = data.macros;
        }
      }

      // Generate dish pairings if missing
      if (!recipe.dishPairings) {
        const pairingsResponse = await fetch("/api/generatePairings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipe: `${recipe.recipeTitle}\nIngredients:\n${recipe.ingredients.join("\n")}\nDirections:\n${recipe.directions.join("\n")}`,
          }),
        });

        if (pairingsResponse.ok) {
          const data = await pairingsResponse.json();
          recipe.dishPairings = data.pairings;
        }
      }

      // Update the recipe in Firestore
      const recipeRef = doc(db, 'recipes', recipe.id);
      const updateData = {
        ingredients: recipe.ingredients || [],
        directions: recipe.directions || [],
        recipeSummary: recipe.recipeSummary || '',
        macroInfo: recipe.macroInfo || null,
        dishPairings: recipe.dishPairings || null,
      };
      await updateDoc(recipeRef, updateData);

      // Update local state
      setRecipes(prev => prev.map(r => r.id === recipe.id ? recipe : r));
      showPointsToast(0, `Successfully modernized "${recipe.recipeTitle}"`);
    } catch (error) {
      console.error('Error modernizing recipe:', error);
      showPointsToast(0, 'Failed to modernize recipe');
    } finally {
      setModernizing(false);
    }
  };

  useEffect(() => {
    fetchRecipes();
  }, [filter]);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Recipe Modernizer</h2>
        <div className="flex items-center gap-4">
          <select
            className="px-4 py-2 border rounded-lg"
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'incomplete')}
          >
            <option value="all">All Recipes</option>
            <option value="incomplete">Incomplete Only</option>
          </select>
          <button
            onClick={() => fetchRecipes()}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <FontAwesomeIcon icon={faSync} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {recipes.map(recipe => (
          <div
            key={recipe.id}
            className="border rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div>
              <h3 className="font-medium text-gray-800">{recipe.recipeTitle}</h3>
              <div className="text-sm text-gray-500 mt-1">
                Missing fields:
                <ul className="list-disc list-inside">
                  {!recipe.ingredients?.length && <li>Ingredients</li>}
                  {!recipe.directions?.length && <li>Directions</li>}
                  {!recipe.recipeSummary && <li>Summary</li>}
                  {!recipe.macroInfo && <li>Nutritional Info</li>}
                  {!recipe.dishPairings && <li>Dish Pairings</li>}
                </ul>
              </div>
            </div>
            <button
              onClick={() => modernizeRecipe(recipe)}
              disabled={modernizing || !needsModernization(recipe)}
              className={`px-4 py-2 rounded-lg ${
                needsModernization(recipe)
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              } transition-colors`}
            >
              {modernizing ? <LoadingSpinner /> : 'Modernize'}
            </button>
          </div>
        ))}

        {recipes.length === 0 && !loading && (
          <div className="text-center py-8 text-gray-500">
            No recipes found. Try adjusting your filter.
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center my-6">
          <LoadingSpinner />
        </div>
      )}

      {!loading && hasMore && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => fetchRecipes(false)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  );
}; 