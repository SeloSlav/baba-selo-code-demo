import { Metadata, ResolvingMetadata } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

type Props = {
  params: { id: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

// Add generateMetadata function
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Get recipe data
  const recipeDoc = await getDoc(doc(db, "recipes", params.id));
  const recipe = recipeDoc.exists() ? recipeDoc.data() : null;

  // Default values
  const defaultTitle = "Recipe | Baba Selo";
  const defaultDescription = "Discover delicious recipes with Baba Selo";
  const defaultImage = "https://www.babaselo.com/baba-removebg.png"; // Using the Baba Selo logo as default

  if (!recipe) {
    return {
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
    title,
    description,
    openGraph: {
      title,
      description,
      images: [image],
      type: 'website',
      url: `https://www.babaselo.com/recipe/${params.id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default function RecipeLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return children;
} 
