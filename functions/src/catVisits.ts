import {onSchedule} from "firebase-functions/v2/scheduler";
import {onRequest} from "firebase-functions/v2/https";
import {logger} from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Firestore
const db = admin.firestore();

export type CatRarity = "common" | "uncommon" | "rare" | "epic" | "legendary";

// Updated spoon multipliers for better rewards
export const SPOON_MULTIPLIERS: Record<CatRarity, number> = {
  common: 25,
  uncommon: 35,
  rare: 50,
  epic: 75,
  legendary: 100,
};

export const VISIT_CAPACITY = {
  common: 1,
  uncommon: 3,
  rare: 5,
  epic: 10,
  legendary: 20,
};

export interface PlacedItem {
  id: string;
  type: string;
  x: number;
  y: number;
  maxVisits?: number;
  remainingVisits?: number;
  rarity?: CatRarity;
  locationId: string;
  userId?: string;
  name: string;
}

interface Cat {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  rarity: CatRarity;
  spoonMultiplier: number;
}

// Constants for cat visit timing
const MIN_VISIT_INTERVAL = 5 * 60 * 1000; // 5 minutes in milliseconds
const BASE_VISIT_CHANCE = 0.4; // 40% base chance for a visit check
const TOY_BONUS_CHANCE = 0.1; // 10% additional chance per toy
const BATCH_SIZE = 10; // Process users in batches of 10

// Cache cats collection
let catsCache: Cat[] | null = null;
let lastCatsFetch = 0;
const CATS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCats(): Promise<Cat[]> {
  const now = Date.now();
  if (catsCache && (now - lastCatsFetch) < CATS_CACHE_TTL) {
    return catsCache;
  }

  const catsSnapshot = await db.collection("cats").get();
  catsCache = catsSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()} as Cat));
  lastCatsFetch = now;
  return catsCache;
}

async function processUserBatch(userDocs: FirebaseFirestore.QueryDocumentSnapshot[]) {
  const cats = await getCats();
  const now = new Date();
  const batch = db.batch();
  const updates: Promise<void>[] = [];

  for (const userDoc of userDocs) {
    const userId = userDoc.id;
    updates.push(processUser(userId, cats, now, batch));
  }

  await Promise.all(updates);
  await batch.commit();
}

async function processUser(
  userId: string,
  cats: Cat[],
  now: Date,
  batch: FirebaseFirestore.WriteBatch,
): Promise<void> {
  try {
    const yardRef = db.collection("users").doc(userId).collection("yard").doc("items");
    const historyRef = db.doc(`users/${userId}/yard/catHistory`);

    // Get yard and history data
    const [yardDoc, historyDoc] = await Promise.all([
      yardRef.get(),
      historyRef.get(),
    ]);

    if (!yardDoc.exists || !yardDoc.data()?.items?.length) {
      return;
    }

    const yardData = yardDoc.data();
    if (!yardData || !Array.isArray(yardData.items)) {
      return;
    }

    // Check last visit time
    const lastVisit = historyDoc.exists ?
      historyDoc.data()?.history?.[0]?.visit?.timestamp?.toDate() :
      new Date(0);

    const timeSinceLastVisit = now.getTime() - lastVisit.getTime();
    if (timeSinceLastVisit < MIN_VISIT_INTERVAL) {
      return;
    }

    // Get active food items and toy count
    const foodItems = yardData.items.filter((item: PlacedItem) =>
      item.locationId?.startsWith("food") &&
      item.remainingVisits &&
      item.remainingVisits > 0 &&
      item.rarity,
    );

    if (foodItems.length === 0) {
      return;
    }

    const toyCount = yardData.items.filter((item: PlacedItem) =>
      item.locationId.startsWith("toy"),
    ).length;

    // Calculate visit chance
    const visitChance = Math.min(BASE_VISIT_CHANCE + (toyCount * TOY_BONUS_CHANCE), 0.9);
    if (Math.random() > visitChance) {
      return;
    }

    const visitedFood = [];
    const updatedItems = [];
    const catVisits = [];
    let totalSpoonReward = 0;

    for (const food of foodItems) {
      const matchingCats = cats.filter((cat) => cat.rarity === food.rarity);
      if (matchingCats.length === 0) continue;

      const randomCat = matchingCats[Math.floor(Math.random() * matchingCats.length)];
      const spoonReward = Math.floor(
        SPOON_MULTIPLIERS[food.rarity as CatRarity] * (randomCat.spoonMultiplier || 1),
      );

      const updatedFood = {
        ...food,
        remainingVisits: (food.remainingVisits || 0) - 1,
      };

      if (updatedFood.remainingVisits > 0) {
        updatedItems.push(updatedFood);
      }

      const visit = {
        catId: randomCat.id,
        timestamp: admin.firestore.Timestamp.now(),
        spoonReward,
        foodItemId: food.id,
        toyItemIds: [],
        read: false,
      };

      catVisits.push({cat: randomCat, visit});
      totalSpoonReward += spoonReward;

      visitedFood.push({
        id: food.id,
        type: food.type,
        name: food.name,
        remainingVisits: updatedFood.remainingVisits,
        userId,
        catName: randomCat.name,
        removed: updatedFood.remainingVisits === 0,
      });
    }

    // Add non-food items back
    const nonFoodItems = yardData.items.filter((item: PlacedItem) =>
      !item.locationId.startsWith("food") ||
      !foodItems.some((foodItem: PlacedItem) => foodItem.id === item.id),
    );
    updatedItems.push(...nonFoodItems);

    // Prepare batch updates
    batch.update(yardRef, {items: updatedItems});

    const pointsRef = db.doc(`spoonPoints/${userId}`);
    const pointsDoc = await pointsRef.get();
    const pointsTransaction = {
      userId,
      actionType: "CAT_VISIT",
      points: totalSpoonReward,
      timestamp: admin.firestore.Timestamp.now(),
      details: visitedFood.map((food) => `${food.catName} enjoyed your ${food.name}!`).join(" "),
      context: {
        visitCount: catVisits.length,
        totalReward: totalSpoonReward,
      },
    };

    if (!pointsDoc.exists) {
      batch.set(pointsRef, {
        totalPoints: totalSpoonReward,
        transactions: [pointsTransaction],
      });
    } else {
      const currentPoints = pointsDoc.data()?.totalPoints || 0;
      const currentTransactions = pointsDoc.data()?.transactions || [];
      batch.update(pointsRef, {
        totalPoints: currentPoints + totalSpoonReward,
        transactions: [pointsTransaction, ...currentTransactions].slice(0, 100),
      });
    }

    if (historyDoc.exists) {
      const currentHistory = historyDoc.data()?.history || [];
      batch.update(historyRef, {
        history: [...catVisits, ...currentHistory].slice(0, 50),
      });
    } else {
      batch.set(historyRef, {history: catVisits});
    }
  } catch (error) {
    logger.error(`Error processing user ${userId}:`, error);
  }
}

export const processCatVisits = onSchedule({
  schedule: "every 5 minutes",
  memory: "512MiB",
  timeoutSeconds: 120,
}, async () => {
  try {
    const usersSnapshot = await db.collection("users").get();
    const userDocs = usersSnapshot.docs;

    // Process users in batches
    for (let i = 0; i < userDocs.length; i += BATCH_SIZE) {
      const batch = userDocs.slice(i, i + BATCH_SIZE);
      await processUserBatch(batch);
    }
  } catch (error) {
    logger.error("Error processing cat visits:", error);
    throw error;
  }
});

// Add HTTP endpoint for testing
export const testCatVisit = onRequest({
  memory: "512MiB",
  timeoutSeconds: 120,
}, async (req, res) => {
  try {
    logger.info("Starting test cat visit");
    const cats = await getCats();
    const now = new Date();
    const batch = db.batch();

    try {
      const knownUserId = "B9E3AdsEAYSrcfl4yPcT1XqyIfC2";
      await processUser(knownUserId, cats, now, batch);
      await batch.commit();

      res.json({
        success: true,
        message: "Test cat visit completed successfully",
      });
    } catch (queryError) {
      logger.error("Error executing test cat visit:", queryError);
      throw queryError;
    }
  } catch (error) {
    logger.error("Error processing test cat visit:", error);
    const typedError = error as {message?: string; code?: number; details?: string};
    res.status(500).json({
      success: false,
      error: typedError.message || "Internal server error",
      errorDetails: {code: typedError.code || 500, details: typedError.details || ""},
    });
  }
});
