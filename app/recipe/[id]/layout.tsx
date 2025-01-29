import { Metadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

type GenerateMetadataParams = {
  params: { id: string };
};

export async function generateMetadata({ params }: GenerateMetadataParams): Promise<Metadata> {
  try {
    // Get recipe data
    const recipeDoc = await getDoc(doc(db, "recipes", params.id));
    const recipe = recipeDoc.exists() ? recipeDoc.data() : null;

    // Default values
    const defaultTitle = "Recipe | Baba Selo";
    const defaultDescription = "Discover delicious recipes with Baba Selo";
    const defaultImage = "https://www.babaselo.com/baba-removebg.png";

    if (!recipe) {
      return {
        metadataBase: new URL('https://www.babaselo.com'),
        title: defaultTitle,
        description: defaultDescription,
        openGraph: {
          title: defaultTitle,
          description: defaultDescription,
          images: [defaultImage],
        },
        twitter: {
          card: 'summary_large_image',
          title: defaultTitle,
          description: defaultDescription,
          images: [defaultImage],
        },
      };
    }

    const title = `${recipe.recipeTitle} | Baba Selo`;
    const description = recipe.recipeSummary || `A delicious ${recipe.cuisineType} recipe for ${recipe.recipeTitle}`;
    const image = recipe.imageURL || defaultImage;

    return {
      metadataBase: new URL('https://www.babaselo.com'),
      title,
      description,
      openGraph: {
        title,
        description,
        images: [image],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      metadataBase: new URL('https://www.babaselo.com'),
      title: 'Recipe | Baba Selo',
      description: 'Discover delicious recipes with Baba Selo',
    };
  }
}

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 
