export type CatRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Cat {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    rarity: CatRarity;
    spoonMultiplier: number;
}

export interface CatVisit {
    catId: string;
    timestamp: Date;
    spoonReward: number;
    foodItemId: string;
    toyItemIds: string[];
    read?: boolean;
}

export interface PlacedItem {
    id: string;
    locationId: string;
    imageUrl: string;
    name: string;
    placedAt?: Date;
    maxVisits?: number;
    remainingVisits?: number;
    rarity?: CatRarity;
    expiresAt?: Date;
}

export interface CatHistoryEntry {
    cat: Cat;
    visit: CatVisit;
} 