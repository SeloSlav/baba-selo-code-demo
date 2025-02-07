import React, { useState, useEffect, useCallback } from 'react';
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

// Add new types for the automation
type ColumnType = 'classification' | 'summary' | 'nutrition' | 'pairings';
type AutomationState = {
  isRunning: boolean;
  currentColumn: ColumnType;
  currentPage: number;
  processingRecipes: Set<string>;
};

const RecipeModernizer: React.FC<RecipeModernizerProps> = ({ showPointsToast }) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [modernizingStates, setModernizingStates] = useState<{[key: string]: Set<string>}>({
    details: new Set(),
    classification: new Set(),
    summary: new Set(),
    nutrition: new Set(),
    pairings: new Set()
  });
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSnapshots, setPageSnapshots] = useState<any[]>([null]);
  const BATCH_SIZE = 7;
  const [automation, setAutomation] = useState<AutomationState>({
    isRunning: false,
    currentColumn: 'classification',
    currentPage: 1,
    processingRecipes: new Set()
  });

  // Calculate total pages
  const totalPages = Math.ceil(totalRecipes / BATCH_SIZE);

  // Helper function to update modernizing states
  const setModernizingState = (type: string, recipeId: string, isLoading: boolean) => {
    setModernizingStates(prev => {
      const newState = { ...prev };
      if (isLoading) {
        newState[type] = new Set(prev[type]).add(recipeId);
      } else {
        newState[type] = new Set([...prev[type]].filter(id => id !== recipeId));
      }
      return newState;
    });
  };

  // Helper function to check if a recipe is being modernized
  const isModernizing = (type: string, recipeId: string) => {
    return modernizingStates[type]?.has(recipeId);
  };

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
        where('directionsCount', '==', 0)
      ));
      setTotalRecipes(snapshot.size);
    } catch (error) {
      console.error('Error fetching total count:', error);
    }
  };

  // Function to fetch recipes for a specific page
  const fetchRecipes = async (page: number = 1) => {
    try {
      setLoading(true);
      setCurrentPage(page);
      
      // Query for recipes that need modernization
      let recipesQuery = query(
        collection(db, 'recipes'),
        where('directionsCount', '==', 0),
        orderBy('createdAt', 'asc'),
        limit(BATCH_SIZE)
      );

      // If going to a page we haven't fetched yet
      if (page > 1) {
        if (page > pageSnapshots.length) {
          // We need to fetch the previous page first
          const prevPageQuery = query(
            collection(db, 'recipes'),
            where('directionsCount', '==', 0),
            orderBy('createdAt', 'asc'),
            startAfter(pageSnapshots[pageSnapshots.length - 1]),
            limit(BATCH_SIZE)
          );
          const prevPageDocs = await getDocs(prevPageQuery);
          const lastDoc = prevPageDocs.docs[prevPageDocs.docs.length - 1];
          setPageSnapshots(prev => [...prev, lastDoc]);
          
          // Now fetch the actual page we want
          recipesQuery = query(
            collection(db, 'recipes'),
            where('directionsCount', '==', 0),
            orderBy('createdAt', 'asc'),
            startAfter(lastDoc),
            limit(BATCH_SIZE)
          );
        } else {
          // We already have the snapshot for the previous page
          recipesQuery = query(
            collection(db, 'recipes'),
            where('directionsCount', '==', 0),
            orderBy('createdAt', 'asc'),
            startAfter(pageSnapshots[page - 1]),
            limit(BATCH_SIZE)
          );
        }
      }

      const recipeDocs = await getDocs(recipesQuery);
      
      // Store the last document of this page if we haven't stored it yet
      if (page >= pageSnapshots.length) {
        const lastDoc = recipeDocs.docs[recipeDocs.docs.length - 1];
        setPageSnapshots(prev => [...prev, lastDoc]);
      }

      const newRecipes = recipeDocs.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date()
        };
      }) as Recipe[];

      setRecipes(newRecipes);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      showPointsToast(0, 'Failed to fetch recipes');
    } finally {
      setLoading(false);
    }
  };

  // Function to generate page numbers array
  const getPageNumbers = () => {
    const pageNumbers: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      // Always show first page
      pageNumbers.push(1);
      
      if (currentPage <= 3) {
        // Near the start
        pageNumbers.push(2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Near the end
        pageNumbers.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Middle
        pageNumbers.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pageNumbers;
  };

  // Helper to check if a recipe is ready for a specific column
  const isRecipeReadyForColumn = (recipe: Recipe, column: ColumnType): boolean => {
    switch (column) {
      case 'classification':
        return true; // Classification can always be generated
      case 'summary':
        // Need classification data before generating summary
        return !!(recipe.cookingTime && recipe.cuisineType && recipe.cookingDifficulty && recipe.diet);
      case 'nutrition':
        // Need basic recipe data for nutrition
        return !!(recipe.ingredients?.length && recipe.directions?.length);
      case 'pairings':
        // Need basic recipe data for pairings
        return !!(recipe.ingredients?.length && recipe.directions?.length);
      default:
        return false;
    }
  };

  // Function to modernize a recipe
  const modernizeRecipe = async (recipe: Recipe) => {
    try {
      setModernizingState('details', recipe.id, true);
      setModernizingState('classification', recipe.id, true);
      setModernizingState('summary', recipe.id, true);
      setModernizingState('nutrition', recipe.id, true);
      setModernizingState('pairings', recipe.id, true);
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
        directionsCount: updatedRecipe.directions.length,
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
      setModernizingState('details', recipe.id, false);
      setModernizingState('classification', recipe.id, false);
      setModernizingState('summary', recipe.id, false);
      setModernizingState('nutrition', recipe.id, false);
      setModernizingState('pairings', recipe.id, false);
    }
  };

  // Add these new functions for individual updates
  const generateBasicDetails = async (recipe: Recipe) => {
    try {
      setModernizingState('details', recipe.id, true);
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
      setModernizingState('details', recipe.id, false);
    }
  };

  const generateClassification = async (recipe: Recipe) => {
    try {
      setModernizingState('classification', recipe.id, true);
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
      setModernizingState('classification', recipe.id, false);
    }
  };

  const generateSummary = async (recipe: Recipe) => {
    try {
      setModernizingState('summary', recipe.id, true);
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
      setModernizingState('summary', recipe.id, false);
    }
  };

  const generateMacroInfo = async (recipe: Recipe) => {
    try {
      setModernizingState('nutrition', recipe.id, true);
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
      setModernizingState('nutrition', recipe.id, false);
    }
  };

  const generatePairings = async (recipe: Recipe) => {
    try {
      setModernizingState('pairings', recipe.id, true);
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
      setModernizingState('pairings', recipe.id, false);
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

  // Helper to check if a column is complete for current page
  const isColumnComplete = useCallback((column: ColumnType) => {
    return recipes.every(recipe => {
      switch (column) {
        case 'classification':
          return recipe.cookingTime && recipe.cuisineType && recipe.cookingDifficulty && recipe.diet;
        case 'summary':
          return recipe.recipeSummary;
        case 'nutrition':
          return recipe.macroInfo;
        case 'pairings':
          return recipe.dishPairings;
      }
    });
  }, [recipes]);

  // Helper to get next column
  const getNextColumn = (current: ColumnType): ColumnType | null => {
    const columns: ColumnType[] = ['classification', 'summary', 'nutrition', 'pairings'];
    const currentIndex = columns.indexOf(current);
    return currentIndex < columns.length - 1 ? columns[currentIndex + 1] : null;
  };

  // Function to process current column
  const processColumn = useCallback(async () => {
    if (!automation.isRunning) return;

    // If all recipes in current page are processed for current column
    if (recipes.length === 0 || isColumnComplete(automation.currentColumn)) {
      const nextColumn = getNextColumn(automation.currentColumn);
      if (nextColumn) {
        // Move to next column on same page
        setAutomation(prev => ({
          ...prev,
          currentColumn: nextColumn,
          processingRecipes: new Set()
        }));
        return;
      } else if (currentPage < totalPages) {
        // Move to next page
        setCurrentPage(currentPage + 1);
        setAutomation(prev => ({
          ...prev,
          currentColumn: 'classification',
          processingRecipes: new Set()
        }));
        return;
      } else {
        // All done!
        setAutomation(prev => ({
          ...prev,
          isRunning: false
        }));
        showPointsToast(0, "Automation complete! All recipes processed.");
        return;
      }
    }

    // Process recipes that need work in current column
    const recipesToProcess = recipes.filter(recipe => {
      // First check if the recipe is ready for this column
      if (!isRecipeReadyForColumn(recipe, automation.currentColumn)) {
        return false;
      }

      // Then check if the column needs to be processed
      switch (automation.currentColumn) {
        case 'classification':
          return !recipe.cookingTime || !recipe.cuisineType || !recipe.cookingDifficulty || !recipe.diet;
        case 'summary':
          return !recipe.recipeSummary;
        case 'nutrition':
          return !recipe.macroInfo;
        case 'pairings':
          return !recipe.dishPairings;
      }
    });

    // Start processing all recipes in current column
    for (const recipe of recipesToProcess) {
      if (!automation.isRunning) break;
      if (automation.processingRecipes.has(recipe.id)) continue;

      setAutomation(prev => ({
        ...prev,
        processingRecipes: new Set([...prev.processingRecipes, recipe.id])
      }));

      try {
        switch (automation.currentColumn) {
          case 'classification':
            await generateClassification(recipe).catch(() => {
              console.log(`Skipping classification for ${recipe.recipeTitle} due to error`);
            });
            break;
          case 'summary':
            if (isRecipeReadyForColumn(recipe, 'summary')) {
              await generateSummary(recipe).catch(() => {
                console.log(`Skipping summary for ${recipe.recipeTitle} due to error`);
              });
            } else {
              console.log(`Skipping summary for ${recipe.recipeTitle} - missing classification data`);
            }
            break;
          case 'nutrition':
            if (isRecipeReadyForColumn(recipe, 'nutrition')) {
              await generateMacroInfo(recipe).catch(() => {
                console.log(`Skipping nutrition for ${recipe.recipeTitle} due to error`);
              });
            } else {
              console.log(`Skipping nutrition for ${recipe.recipeTitle} - missing required data`);
            }
            break;
          case 'pairings':
            if (isRecipeReadyForColumn(recipe, 'pairings')) {
              await generatePairings(recipe).catch(() => {
                console.log(`Skipping pairings for ${recipe.recipeTitle} due to error`);
              });
            } else {
              console.log(`Skipping pairings for ${recipe.recipeTitle} - missing required data`);
            }
            break;
        }
      } catch (error) {
        // Log error but continue with next recipe
        console.log(`Error processing ${recipe.recipeTitle}, skipping to next recipe:`, error);
      } finally {
        setAutomation(prev => ({
          ...prev,
          processingRecipes: new Set([...prev.processingRecipes].filter(id => id !== recipe.id))
        }));
      }
    }
  }, [automation.isRunning, automation.currentColumn, automation.processingRecipes, recipes, currentPage, totalPages, isColumnComplete]);

  // Effect to handle page changes
  useEffect(() => {
    if (automation.isRunning) {
      const loadPage = async () => {
        setLoading(true);
        await fetchRecipes(currentPage);
        // Reset to classification column whenever we load a new page
        setAutomation(prev => ({
          ...prev,
          currentColumn: 'classification',
          processingRecipes: new Set()
        }));
        setLoading(false);
      };
      loadPage();
    }
  }, [currentPage, automation.isRunning]);

  // Effect to run automation
  useEffect(() => {
    const runAutomation = async () => {
      if (automation.isRunning && !loading && automation.processingRecipes.size === 0) {
        // Check if current page is complete
        if (recipes.length === 0 || isColumnComplete(automation.currentColumn)) {
          const nextColumn = getNextColumn(automation.currentColumn);
          if (nextColumn) {
            // Move to next column on same page
            setAutomation(prev => ({
              ...prev,
              currentColumn: nextColumn,
              processingRecipes: new Set()
            }));
          } else if (currentPage < totalPages) {
            // Move to next page and reset to classification
            setCurrentPage(prev => prev + 1);
          } else {
            // All done!
            setAutomation(prev => ({
              ...prev,
              isRunning: false
            }));
            showPointsToast(0, "Automation complete! All recipes processed.");
          }
        } else {
          // Process current column
          await processColumn();
        }
      }
    };
    runAutomation();
  }, [automation.isRunning, loading, automation.processingRecipes.size, recipes, currentPage, totalPages, processColumn, isColumnComplete]);

  // Initial fetch
  useEffect(() => {
    const initialFetch = async () => {
      await fetchRecipes(1);
      await fetchTotalCount();
    };
    initialFetch();
  }, []);

  return (
    <div className="bg-white rounded-xl p-6 mb-8">
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

          <button
            onClick={() => setAutomation(prev => ({
              ...prev,
              isRunning: !prev.isRunning,
              currentColumn: 'classification',
              currentPage: 1,
              processingRecipes: new Set()
            }))}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              automation.isRunning
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-green-100 text-green-600 hover:bg-green-200'
            }`}
          >
            {automation.isRunning ? '⏹️ Stop Agent' : '▶️ Start Agent'}
          </button>

          {automation.isRunning && (
            <span className="text-sm text-gray-600">
              Processing {automation.currentColumn} 
              {automation.processingRecipes.size > 0 && ` (${automation.processingRecipes.size} active)`}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {recipes.map((recipe) => (
          <div
            key={recipe.id}
            className="border rounded-lg p-3 flex items-center hover:bg-gray-50 transition-colors"
          >
            <div className="w-[250px] flex-shrink-0">
              <a 
                href={`/recipe/${recipe.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-800 hover:underline block truncate"
              >
                {recipe.recipeTitle}
              </a>
            </div>

            <div className="flex gap-1 flex-1">
              <button
                onClick={() => generateBasicDetails(recipe)}
                disabled={Object.values(modernizingStates).some(set => set.has(recipe.id))}
                className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                  isModernizing('details', recipe.id)
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-600' 
                    : (!recipe.ingredients?.length || !recipe.directions?.length)
                      ? 'bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer hover:scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer hover:scale-105'
                }`}
              >
                {isModernizing('details', recipe.id)
                  ? 'Updating...' 
                  : (!recipe.ingredients?.length || !recipe.directions?.length)
                    ? 'No Details'
                    : 'Try Details Again'}
              </button>

              <button
                onClick={() => generateClassification(recipe)}
                disabled={Object.values(modernizingStates).some(set => set.has(recipe.id))}
                className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                  isModernizing('classification', recipe.id)
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-600' 
                    : (!recipe.cookingTime || !recipe.cuisineType || !recipe.cookingDifficulty || !recipe.diet)
                      ? 'bg-purple-100 text-purple-600 hover:bg-purple-200 cursor-pointer hover:scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer hover:scale-105'
                }`}
              >
                {isModernizing('classification', recipe.id)
                  ? 'Updating...' 
                  : (!recipe.cookingTime || !recipe.cuisineType || !recipe.cookingDifficulty || !recipe.diet)
                    ? 'No Classification'
                    : 'Try Classification Again'}
              </button>

              <button
                onClick={() => generateSummary(recipe)}
                disabled={Object.values(modernizingStates).some(set => set.has(recipe.id))}
                className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                  isModernizing('summary', recipe.id)
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-600' 
                    : !recipe.recipeSummary
                      ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200 cursor-pointer hover:scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer hover:scale-105'
                }`}
              >
                {isModernizing('summary', recipe.id)
                  ? 'Updating...' 
                  : !recipe.recipeSummary
                    ? 'No Summary'
                    : 'Try Summary Again'}
              </button>

              <button
                onClick={() => generateMacroInfo(recipe)}
                disabled={Object.values(modernizingStates).some(set => set.has(recipe.id))}
                className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                  isModernizing('nutrition', recipe.id)
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-600' 
                    : !recipe.macroInfo
                      ? 'bg-green-100 text-green-600 hover:bg-green-200 cursor-pointer hover:scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer hover:scale-105'
                }`}
              >
                {isModernizing('nutrition', recipe.id)
                  ? 'Updating...' 
                  : !recipe.macroInfo
                    ? 'No Nutrition'
                    : 'Try Nutrition Again'}
              </button>

              <button
                onClick={() => generatePairings(recipe)}
                disabled={Object.values(modernizingStates).some(set => set.has(recipe.id))}
                className={`px-1.5 py-0.5 text-xs rounded transition-colors ${
                  isModernizing('pairings', recipe.id)
                    ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-600' 
                    : !recipe.dishPairings
                      ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer hover:scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 cursor-pointer hover:scale-105'
                }`}
              >
                {isModernizing('pairings', recipe.id)
                  ? 'Updating...' 
                  : !recipe.dishPairings
                    ? 'No Pairings'
                    : 'Try Pairings Again'}
              </button>
            </div>

            <button
              onClick={() => handleDeleteRecipe(recipe.id)}
              disabled={deletingId === recipe.id}
              className={`ml-4 px-2 py-1 text-sm rounded transition-colors flex-shrink-0
                ${deletingId === recipe.id 
                  ? 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-600' 
                  : 'bg-red-100 text-red-600 hover:bg-red-200 cursor-pointer hover:scale-105'
                }`}
            >
              {deletingId === recipe.id ? '...' : '🗑️ Delete'}
            </button>
          </div>
        ))}

        {recipes.length === 0 && !loading && (
          <div className="text-center py-6 text-gray-500 text-sm">
            No recipes found missing directions.
          </div>
        )}
      </div>

      {loading && (
        <div className="flex justify-center my-4">
          <LoadingSpinner />
        </div>
      )}

      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => fetchRecipes(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faArrowLeft} className="mr-1" />
            Previous
          </button>

          {getPageNumbers().map((pageNum, index) => (
            <React.Fragment key={index}>
              {pageNum === '...' ? (
                <span className="px-3 py-2">...</span>
              ) : (
                <button
                  onClick={() => fetchRecipes(pageNum as number)}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    currentPage === pageNum
                      ? 'bg-black text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {pageNum}
                </button>
              )}
            </React.Fragment>
          ))}

          <button
            onClick={() => fetchRecipes(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <FontAwesomeIcon icon={faArrowRight} className="ml-1" />
          </button>
        </div>
      )}
    </div>
  );
};

export default RecipeModernizer; 