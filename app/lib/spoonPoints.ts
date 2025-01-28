import { doc, getDoc, setDoc, updateDoc, increment, Timestamp, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase/firebase';

// Types for the point system
interface PointAction {
  type: string;
  points: number;
  cooldown: number; // cooldown in minutes
  maxPerDay?: number;
  requiresUnique?: boolean; // if true, checks if this exact action was done before
  context?: Record<string, any>; // additional data for validation
}

interface PointTransaction {
  userId: string;
  actionType: string;
  points: number;
  timestamp: Timestamp;
  context?: Record<string, any>;
  targetId?: string; // e.g., recipeId for recipe-related actions
}

// Configuration for different point-earning actions
export const POINT_ACTIONS: Record<string, PointAction> = {
  SAVE_RECIPE: {
    type: 'SAVE_RECIPE',
    points: 5,
    cooldown: 1, // 1 minute cooldown
    requiresUnique: true, // prevent saving the same recipe multiple times
  },
  GENERATE_RECIPE: {
    type: 'GENERATE_RECIPE',
    points: 5,
    cooldown: 5, // 5 minutes cooldown
    maxPerDay: 10,
  },
  GENERATE_SUMMARY: {
    type: 'GENERATE_SUMMARY',
    points: 15,
    cooldown: 30,
    requiresUnique: true, // prevent regenerating same recipe summary
  },
  GENERATE_NUTRITION: {
    type: 'GENERATE_NUTRITION',
    points: 20,
    cooldown: 60,
    requiresUnique: true,
  },
  GENERATE_PAIRINGS: {
    type: 'GENERATE_PAIRINGS',
    points: 15,
    cooldown: 30,
    requiresUnique: true,
  },
  GENERATE_IMAGE: {
    type: 'GENERATE_IMAGE',
    points: 10,
    cooldown: 15,
    maxPerDay: 20,
  },
  UPLOAD_IMAGE: {
    type: 'UPLOAD_IMAGE',
    points: 25,
    cooldown: 60,
    requiresUnique: true,
  },
  CHAT_INTERACTION: {
    type: 'CHAT_INTERACTION',
    points: 5,
    cooldown: 1,
    maxPerDay: 50,
  },
  PIN_RECIPE: {
    type: 'PIN_RECIPE',
    points: 5,
    cooldown: 1,
    requiresUnique: true,
  },
  RECIPE_SAVED_BY_OTHER: {
    type: 'RECIPE_SAVED_BY_OTHER',
    points: 10,
    cooldown: 0, // no cooldown for community actions
    requiresUnique: true,
  }
};

export class SpoonPointSystem {
  private static async getActionHistory(
    userId: string,
    actionType: string,
    targetId?: string,
    since?: Date
  ): Promise<PointTransaction[]> {
    const userPointsRef = doc(db, 'spoonPoints', userId);
    const userPointsDoc = await getDoc(userPointsRef);
    
    if (!userPointsDoc.exists()) return [];
    
    const transactions = userPointsDoc.data().transactions || [];
    return transactions.filter((t: PointTransaction) => {
      const matchesAction = t.actionType === actionType;
      const matchesTarget = !targetId || t.targetId === targetId;
      const matchesTime = !since || t.timestamp.toDate() > since;
      return matchesAction && matchesTarget && matchesTime;
    });
  }

  private static async validateAction(
    userId: string,
    action: PointAction,
    targetId?: string,
    context?: Record<string, any>
  ): Promise<{ valid: boolean; reason?: string }> {
    const now = new Date();
    const cooldownDate = new Date(now.getTime() - action.cooldown * 60 * 1000);
    const dayStart = new Date(now.setHours(0, 0, 0, 0));

    // Get recent actions
    const recentActions = await this.getActionHistory(userId, action.type, targetId, cooldownDate);
    
    // Check cooldown
    if (recentActions.length > 0 && action.cooldown > 0) {
      return { valid: false, reason: 'Action on cooldown' };
    }

    // Check daily limit
    if (action.maxPerDay) {
      const todayActions = await this.getActionHistory(userId, action.type, undefined, dayStart);
      if (todayActions.length >= action.maxPerDay) {
        return { valid: false, reason: 'Daily limit reached' };
      }
    }

    // Check uniqueness
    if (action.requiresUnique && targetId) {
      const allActions = await this.getActionHistory(userId, action.type, targetId);
      if (allActions.length > 0) {
        return { valid: false, reason: 'Action already performed on this target' };
      }
    }

    // Custom validation based on context
    if (context && action.context) {
      // Implement custom validation logic here
      // For example, checking if a chat interaction is meaningful
      // or if an image meets quality requirements
    }

    return { valid: true };
  }

  public static async awardPoints(
    userId: string,
    actionType: string,
    targetId?: string,
    context?: Record<string, any>
  ): Promise<{ success: boolean; points?: number; error?: string }> {
    try {
      const action = POINT_ACTIONS[actionType];
      if (!action) {
        return { success: false, error: 'Invalid action type' };
      }

      // Validate the action
      const validation = await this.validateAction(userId, action, targetId, context);
      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }

      // Create transaction record
      const transaction: PointTransaction = {
        userId,
        actionType,
        points: action.points,
        timestamp: Timestamp.now(),
        targetId: targetId || null,
        context: context || null
      };

      // Get reference to user's points document
      const userPointsRef = doc(db, 'spoonPoints', userId);
      const userPointsDoc = await getDoc(userPointsRef);

      if (!userPointsDoc.exists()) {
        // Initialize the document if it doesn't exist
        await setDoc(userPointsRef, {
          totalPoints: action.points,
          pointsHistory: [{
            date: transaction.timestamp.toDate().toISOString().split('T')[0],
            points: action.points
          }],
          transactions: [transaction]
        });
      } else {
        // Update existing document
        await updateDoc(userPointsRef, {
          totalPoints: increment(action.points),
          pointsHistory: arrayUnion({
            date: transaction.timestamp.toDate().toISOString().split('T')[0],
            points: action.points
          }),
          transactions: arrayUnion(transaction)
        });
      }

      return { success: true, points: action.points };
    } catch (error) {
      console.error('Error awarding points:', error);
      return { success: false, error: 'Internal error' };
    }
  }

  // Helper method to check if an action is available
  public static async isActionAvailable(
    userId: string,
    actionType: string,
    targetId?: string
  ): Promise<{ available: boolean; reason?: string }> {
    const action = POINT_ACTIONS[actionType];
    if (!action) {
      return { available: false, reason: 'Invalid action type' };
    }

    const validation = await this.validateAction(userId, action, targetId);
    return { available: validation.valid, reason: validation.reason };
  }
}

// Example usage:
/*
// In your component or handler:
const handleGenerateRecipe = async () => {
  const result = await SpoonPointSystem.awardPoints(
    userId,
    'GENERATE_RECIPE',
    recipeId,
    { quality: 'high', length: 500 }
  );
  
  if (result.success) {
    console.log(`Earned ${result.points} points!`);
  } else {
    console.log(`Couldn't award points: ${result.error}`);
  }
};

// Check if action is available before showing UI element:
const checkAvailability = async () => {
  const { available, reason } = await SpoonPointSystem.isActionAvailable(
    userId,
    'GENERATE_RECIPE',
    recipeId
  );
  setButtonEnabled(available);
  if (!available) setTooltip(reason);
};
*/ 