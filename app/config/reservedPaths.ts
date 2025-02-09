// List of paths that cannot be used as usernames
export const RESERVED_PATHS = [
    'admin',
    'api',
    'auth',
    'login',
    'logout',
    'marketplace',
    'notifications',
    'profile',
    'recipe',
    'recipes',
    'settings',
    'signup',
    'yard',
    'chat',
    'about',
    'help',
    'terms',
    'privacy',
    'contact',
    'search',
    'explore',
    'home'
];

// Function to check if a path is reserved
export const isReservedPath = (path: string): boolean => {
    return RESERVED_PATHS.includes(path.toLowerCase());
}; 