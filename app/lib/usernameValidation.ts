import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { isReservedPath } from '../config/reservedPaths';

export interface UsernameValidationResult {
    isValid: boolean;
    error?: string;
}

export const validateUsername = async (username: string): Promise<UsernameValidationResult> => {
    // Check length
    if (username.length < 3 || username.length > 20) {
        return {
            isValid: false,
            error: 'Username must be between 3 and 20 characters'
        };
    }

    // Check characters (only letters, numbers, and underscores)
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return {
            isValid: false,
            error: 'Username can only contain letters, numbers, and underscores'
        };
    }

    // Check if it's a reserved path
    if (isReservedPath(username)) {
        return {
            isValid: false,
            error: 'This username is not available'
        };
    }

    // Check if username already exists
    const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', username.toLowerCase())
    );
    const userSnapshot = await getDocs(usersQuery);

    if (!userSnapshot.empty) {
        return {
            isValid: false,
            error: 'Username is already taken'
        };
    }

    return { isValid: true };
}; 