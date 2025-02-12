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
  common: 25, // Was 1.0
  uncommon: 35, // Was 1.5
  rare: 50, // Was 2.0
  epic: 75, // Was 3.0
  legendary: 100, // Was 5.0
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

export const processCatVisits = onSchedule({
  schedule: "every 5 minutes",
  memory: "256MiB",
}, async () => {
  try {
    // Get all users first
    const usersSnapshot = await db.collection("users").get();

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Use a transaction to ensure atomic updates
      await db.runTransaction(async (transaction) => {
        // Get the user's yard items
        const yardRef = db.collection("users").doc(userId).collection("yard").doc("items");
        const yardDoc = await transaction.get(yardRef);

        if (!yardDoc.exists || !yardDoc.data()?.items?.length) {
          return;
        }

        const yardData = yardDoc.data();
        if (!yardData || !Array.isArray(yardData.items)) {
          return;
        }

        // Filter for active food items
        const foodItems = yardData.items.filter((item: PlacedItem) =>
          item.locationId?.startsWith("food") &&
          item.remainingVisits &&
          item.remainingVisits > 0 &&
          item.rarity
        );

        if (foodItems.length === 0) {
          return;
        }

        // Get all cats
        const catsRef = db.collection("cats");
        const catsSnapshot = await transaction.get(catsRef);
        const cats = catsSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()} as Cat));
        logger.info(`Found ${cats.length} cats in total`);

        // Get history reference
        const historyRef = db.doc(`users/${userId}/yard/catHistory`);
        const historyDoc = await transaction.get(historyRef);

        // Check last visit time
        const lastVisit = historyDoc.exists ?
          historyDoc.data()?.history?.[0]?.visit?.timestamp?.toDate() :
          new Date(0);

        const now = new Date();
        const timeSinceLastVisit = now.getTime() - lastVisit.getTime();

        // If not enough time has passed since last visit, skip this user
        if (timeSinceLastVisit < MIN_VISIT_INTERVAL) {
          return;
        }

        // Count toys to calculate visit chance
        const toyCount = yardData.items.filter((item: PlacedItem) =>
          item.locationId.startsWith("toy")
        ).length;

        // Calculate visit chance
        const visitChance = Math.min(BASE_VISIT_CHANCE + (toyCount * TOY_BONUS_CHANCE), 0.9);

        // Random check if cats will visit
        if (Math.random() > visitChance) {
          return;
        }

        const visitedFood = [];
        const updatedItems = [];
        const catVisits = [];

        for (const food of foodItems) {
          // Get a random cat matching the food's rarity
          const matchingCats = cats.filter((cat) => cat.rarity === food.rarity);
          logger.info(`Matching cats: ${matchingCats.map((cat) => cat.name)}`);

          if (matchingCats.length === 0) {
            continue;
          }

          const randomCat = matchingCats[Math.floor(Math.random() * matchingCats.length)];
          logger.info(`Selected cat: ${randomCat.name}`);

          // Calculate spoon reward
          const spoonReward = Math.floor(
            SPOON_MULTIPLIERS[food.rarity as CatRarity] * (randomCat.spoonMultiplier || 1)
          );
          logger.info(`Calculated spoon reward: ${spoonReward}`);

          // Update food item
          const updatedFood = {
            ...food,
            remainingVisits: (food.remainingVisits || 0) - 1,
          };
          logger.info(`Updated food remaining visits: ${updatedFood.remainingVisits}`);

          // If visits remain, keep the item
          if (updatedFood.remainingVisits > 0) {
            updatedItems.push(updatedFood);
          }

          // Create cat visit entry
          const visit = {
            catId: randomCat.id,
            timestamp: admin.firestore.Timestamp.now(),
            spoonReward,
            foodItemId: food.id,
            toyItemIds: [],
            read: false,
          };

          // Add visit to history
          catVisits.push({
            cat: randomCat,
            visit,
          });

          visitedFood.push({
            id: food.id,
            type: food.type,
            name: food.name,
            remainingVisits: updatedFood.remainingVisits,
            userId,
            catName: randomCat.name,
            removed: updatedFood.remainingVisits === 0,
          });

          // Award spoon points
          const userPointsRef = db.doc(`spoonPoints/${userId}`);
          const userPointsDoc = await transaction.get(userPointsRef);
          logger.info(`Awarding ${spoonReward} spoon points to user ${userId}`);

          const pointsTransaction = {
            userId,
            actionType: "CAT_VISIT",
            points: spoonReward,
            timestamp: admin.firestore.Timestamp.now(),
            details: `${randomCat.name} visited and enjoyed your ${food.name}!`,
            context: {
              catName: randomCat.name,
              rarity: randomCat.rarity,
              spoonReward,
            },
          };

          if (!userPointsDoc.exists) {
            transaction.set(userPointsRef, {
              totalPoints: spoonReward,
              transactions: [pointsTransaction],
            });
          } else {
            const currentPoints = userPointsDoc.data()?.totalPoints || 0;
            const currentTransactions = userPointsDoc.data()?.transactions || [];
            transaction.update(userPointsRef, {
              totalPoints: currentPoints + spoonReward,
              transactions: [pointsTransaction, ...currentTransactions].slice(0, 100), // Keep last 100 transactions
            });
          }
        }

        // Add non-food items back to the array
        const nonFoodItems = yardData.items.filter((item: PlacedItem) =>
          !item.locationId.startsWith("food") ||
          !foodItems.some((foodItem: PlacedItem) => foodItem.id === item.id)
        );
        updatedItems.push(...nonFoodItems);

        // Update yard items within transaction
        transaction.update(yardRef, {items: updatedItems});

        // Update cat history within transaction
        if (historyDoc.exists) {
          const currentHistory = historyDoc.data()?.history || [];
          transaction.update(historyRef, {
            history: [...catVisits, ...currentHistory].slice(0, 50), // Keep last 50 visits
          });
        } else {
          transaction.set(historyRef, {
            history: catVisits,
          });
        }
      });
    }
  } catch (error) {
    logger.error("Error processing cat visits:", error);
    throw error; // Re-throw to ensure the error is properly logged
  }
});

// Add HTTP endpoint for testing
export const testCatVisit = onRequest({memory: "256MiB"}, async (req, res) => {
  try {
    logger.info("Starting test cat visit");

    try {
      // Try to get the specific user's yard first
      const knownUserId = "B9E3AdsEAYSrcfl4yPcT1XqyIfC2";
      logger.info(`Attempting to get yard for known user ID: ${knownUserId}`);
      const knownUserYardRef = db.doc(`users/${knownUserId}/yard/items`);
      const knownUserYardDoc = await knownUserYardRef.get();

      if (!knownUserYardDoc.exists) {
        logger.error(`No yard document found for known user at path: ${knownUserYardRef.path}`);
        res.status(412).json({
          success: false,
          error: "No yard document found",
          errorDetails: {code: 9, details: "Could not find yard document for known user"},
        });
        return;
      }

      const yardData = knownUserYardDoc.data();
      logger.info("Yard data:", JSON.stringify(yardData));

      if (!yardData || !Array.isArray(yardData.items)) {
        logger.error("Invalid yard items structure");
        res.status(412).json({
          success: false,
          error: "Invalid yard items structure",
          errorDetails: {code: 9, details: `Expected array, got ${typeof yardData?.items}`},
        });
        return;
      }

      // Filter for active food items
      const foodItems = yardData.items.filter((item: PlacedItem) => {
        const hasLocationId = item.locationId?.startsWith("food");
        const hasRemainingVisits = item.remainingVisits && item.remainingVisits > 0;
        const hasRarity = item.rarity && ["common", "uncommon", "rare", "epic", "legendary"].includes(item.rarity);

        logger.info(`Food item validation for ${item.name}:`, {
          hasLocationId,
          hasRemainingVisits,
          hasRarity,
          locationId: item.locationId,
          remainingVisits: item.remainingVisits,
          rarity: item.rarity,
        });

        return hasLocationId && hasRemainingVisits && hasRarity;
      });

      logger.info(`Found ${foodItems.length} valid food items`);

      if (foodItems.length === 0) {
        logger.error("No valid food items found in yard");
        res.status(412).json({
          success: false,
          error: "No valid food items",
          errorDetails: {code: 9, details: "No valid food items found in yard"},
        });
        return;
      }

      // Get all cats
      const catsRef = db.collection("cats");
      const catsSnapshot = await catsRef.get();

      if (catsSnapshot.empty) {
        logger.error("No cats found in the database");
        res.status(412).json({
          success: false,
          error: "No cats found in the database",
          errorDetails: {code: 9, details: "Cats collection is empty"},
        });
        return;
      }

      const cats = catsSnapshot.docs.map((doc) => ({id: doc.id, ...doc.data()} as Cat));
      logger.info(`Found ${cats.length} cats in total`);
      logger.info("Available cats:", JSON.stringify(cats.map((cat) => ({
        name: cat.name,
        rarity: cat.rarity,
      }))));

      const visitedFood = [];
      const updatedItems = [];
      const catVisits = [];

      for (const food of foodItems) {
        logger.info(`Processing food item: ${food.name} with rarity ${food.rarity}`);
        // Get a random cat matching the food's rarity
        const matchingCats = cats.filter((cat) => cat.rarity === food.rarity);
        logger.info(`Found ${matchingCats.length} cats matching rarity ${food.rarity}`);
        logger.info("Matching cats:", JSON.stringify(matchingCats.map((cat) => cat.name)));

        if (matchingCats.length === 0) {
          logger.warn(`No cats found matching rarity ${food.rarity}`);
          continue;
        }
        const randomCat = matchingCats[Math.floor(Math.random() * matchingCats.length)];
        logger.info(`Selected cat: ${randomCat.name}`);

        // Calculate spoon reward
        const spoonReward = Math.floor(
          SPOON_MULTIPLIERS[food.rarity as CatRarity] * (randomCat.spoonMultiplier || 1)
        );
        logger.info(`Calculated spoon reward: ${spoonReward}`);

        // Update food item
        const updatedFood = {
          ...food,
          remainingVisits: (food.remainingVisits || 0) - 1,
        };
        logger.info(`Updated food remaining visits: ${updatedFood.remainingVisits}`);

        // If visits remain, keep the item
        if (updatedFood.remainingVisits > 0) {
          updatedItems.push(updatedFood);
        }

        // Create cat visit entry
        const visit = {
          catId: randomCat.id,
          timestamp: admin.firestore.Timestamp.now(),
          spoonReward,
          foodItemId: food.id,
          toyItemIds: [],
          read: false,
        };

        // Add visit to history
        catVisits.push({
          cat: randomCat,
          visit,
        });

        visitedFood.push({
          id: food.id,
          type: food.type,
          name: food.name,
          remainingVisits: updatedFood.remainingVisits,
          userId: knownUserId,
          catName: randomCat.name,
          removed: updatedFood.remainingVisits === 0,
        });

        // Award spoon points
        const userPointsRef = db.doc(`spoonPoints/${knownUserId}`);
        const userPointsDoc = await userPointsRef.get();
        logger.info(`Awarding ${spoonReward} spoon points to user ${knownUserId}`);

        const transaction = {
          userId: knownUserId,
          actionType: "CAT_VISIT",
          points: spoonReward,
          timestamp: admin.firestore.Timestamp.now(),
          details: `${randomCat.name} visited and enjoyed your ${food.name}!`,
          context: {
            catName: randomCat.name,
            rarity: randomCat.rarity,
            spoonReward,
          },
        };

        if (!userPointsDoc.exists) {
          await userPointsRef.set({
            totalPoints: spoonReward,
            transactions: [transaction],
          });
        } else {
          await userPointsRef.update({
            totalPoints: admin.firestore.FieldValue.increment(spoonReward),
            transactions: admin.firestore.FieldValue.arrayUnion(transaction),
          });
        }
      }

      // Add non-food items back to the array
      const nonFoodItems = yardData.items.filter((item: PlacedItem) =>
        !item.locationId.startsWith("food") ||
        !foodItems.some((foodItem: PlacedItem) => foodItem.id === item.id)
      );
      updatedItems.push(...nonFoodItems);

      // Update yard items
      await knownUserYardRef.update({items: updatedItems});
      logger.info(`Updated yard items for user ${knownUserId}`);

      // Get history reference
      const historyRef = db.doc(`users/${knownUserId}/yard/catHistory`);
      const historyDoc = await historyRef.get();

      // Update cat history
      if (historyDoc.exists) {
        const currentHistory = historyDoc.data()?.history || [];
        await historyRef.update({
          history: [...catVisits, ...currentHistory].slice(0, 50), // Keep last 50 visits
        });
      } else {
        await historyRef.set({
          history: catVisits,
        });
      }
      logger.info(`Updated cat history for user ${knownUserId}`);

      logger.info("Test cat visit completed successfully");
      res.json({
        success: true,
        results: [{
          userId: knownUserId,
          visitedFood,
          catVisits,
        }],
      });
    } catch (queryError) {
      logger.error("Error executing yard query:", queryError);
      throw queryError;
    }
  } catch (error) {
    logger.error("Error processing test cat visit:", error);
    const typedError = error as { message?: string; code?: number; details?: string };
    res.status(500).json({
      success: false,
      error: typedError.message || "Internal server error",
      errorDetails: {code: typedError.code || 500, details: typedError.details || ""},
    });
  }
});
