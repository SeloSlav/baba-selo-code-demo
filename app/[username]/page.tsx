'use client';

import React from 'react';
import { isReservedPath } from '../config/reservedPaths';
import { notFound } from 'next/navigation';
import UserProfileClient from './UserProfileClient';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export default function UserProfile({
    params,
}: {
    params: Promise<{ username: string }>
}) {
    const { username } = React.use(params);
    const [userId, setUserId] = React.useState<string | null>(null);

    React.useEffect(() => {
        async function fetchUser() {
            if (isReservedPath(username)) {
                notFound();
            }

            const usersQuery = query(
                collection(db, 'users'),
                where('username', '==', username.toLowerCase())
            );
            const userSnapshot = await getDocs(usersQuery);

            if (userSnapshot.empty) {
                notFound();
            }

            setUserId(userSnapshot.docs[0].id);
        }

        fetchUser();
    }, [username]);

    if (!userId) {
        return null; // or loading state
    }

    return <UserProfileClient userId={userId} username={username} />;
} 