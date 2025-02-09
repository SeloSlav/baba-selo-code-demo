import React from 'react';
import { isReservedPath } from '../config/reservedPaths';
import { notFound } from 'next/navigation';
import UserProfileClient from './UserProfileClient';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

interface PageProps {
    params: Promise<{ username: string }>;
    searchParams: Record<string, string | string[] | undefined>;
}

async function getUser(username: string) {
    const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', username.toLowerCase())
    );
    return await getDocs(usersQuery);
}

export default async function UserProfile({ params }: PageProps) {
    const { username } = await params;

    if (isReservedPath(username)) {
        notFound();
    }

    const userSnapshot = await getUser(username);

    if (userSnapshot.empty) {
        notFound();
    }

    const userId = userSnapshot.docs[0].id;

    return <UserProfileClient userId={userId} username={username} />;
} 