export const getCategoryColor = (category: string): string => {
    switch (category) {
        case 'food':
            return 'bg-orange-100 text-orange-600';
        case 'toy':
            return 'bg-indigo-100 text-indigo-600';
        case 'accessory':
            return 'bg-pink-100 text-pink-600';
        case 'Olive Oil':
            return 'bg-green-100 text-green-600';
        default:
            return 'bg-gray-100 text-gray-600';
    }
};

export const getRarityColor = (rarity: string): string => {
    switch (rarity) {
        case 'common':
            return 'bg-gray-100 text-gray-600';
        case 'uncommon':
            return 'bg-green-100 text-green-600';
        case 'rare':
            return 'bg-blue-100 text-blue-600';
        case 'epic':
            return 'bg-purple-100 text-purple-600';
        case 'legendary':
            return 'bg-yellow-100 text-yellow-600';
        default:
            return 'bg-gray-100 text-gray-600';
    }
};

export const RARITY_ORDER = {
    'rare': 2,
    'epic': 3,
    'legendary': 4,
    'uncommon': 1,
    'common': 0
}; 