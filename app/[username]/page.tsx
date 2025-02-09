import React from 'react';
import { isReservedPath } from '../config/reservedPaths';
import { notFound } from 'next/navigation';
import UserProfileClient from './UserProfileClient';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { Metadata } from 'next';

interface PageProps {
    params: { username: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    return {
        title: `${params.username}'s Profile | Baba Selo`,
        description: `Check out ${params.username}'s recipes on Baba Selo`
    };
}

export default async function UserProfile({
    params,
}: PageProps) {
    // Check if username is a reserved path
    if (isReservedPath(params.username)) {
        notFound();
    }

    // Find user by username
    const usersQuery = query(
        collection(db, 'users'),
        where('username', '==', params.username.toLowerCase())
    );
    const userSnapshot = await getDocs(usersQuery);

    if (userSnapshot.empty) {
        notFound();
    }

    const userId = userSnapshot.docs[0].id;

    return <UserProfileClient userId={userId} username={params.username} />;
} 