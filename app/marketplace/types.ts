export type Category = 'food' | 'toy' | 'accessory' | 'Olive Oil';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Goodie {
    id: string;
    name: string;
    description: string;
    cost: number;
    rarity: Rarity;
    imageUrl: string;
    category: Category;
}

export interface UserInventoryItem extends Goodie {
    purchasedAt: Date;
}

export interface MarketplaceState {
    goodies: Goodie[];
    userInventory: UserInventoryItem[];
    loading: boolean;
    error: string | null;
} 