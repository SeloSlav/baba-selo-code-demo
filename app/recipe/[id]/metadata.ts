import { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const recipeDoc = await getDoc(doc(db, "recipes", params.id));
    const recipe = recipeDoc.exists() ? recipeDoc.data() : null;

    if (!recipe) {
      return {
        title: 'Recipe | Baba Selo',
        description: 'Discover delicious recipes with Baba Selo',
      };
    }

    return {
      title: `${recipe.recipeTitle} | Baba Selo`,
      description: recipe.recipeSummary || `A delicious ${recipe.cuisineType} recipe for ${recipe.recipeTitle}`,
      openGraph: {
        type: 'website',
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Recipe | Baba Selo',
      description: 'Discover delicious recipes with Baba Selo',
    };
  }
} 