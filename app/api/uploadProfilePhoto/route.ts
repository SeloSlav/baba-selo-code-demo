import { NextResponse } from 'next/server';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/firebase';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const userId = formData.get('userId') as string;

        if (!file) {
            return NextResponse.json(
                { error: 'No file provided' },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: 'No user ID provided' },
                { status: 400 }
            );
        }

        // Convert file to array buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create a reference to the file location in Firebase Storage
        const fileRef = ref(storage, `profilePhotos/${userId}/${Date.now()}_${file.name}`);

        // Upload the file
        await uploadBytes(fileRef, buffer, {
            contentType: file.type,
        });

        // Get the download URL
        const photoUrl = await getDownloadURL(fileRef);

        return NextResponse.json({ photoUrl });
    } catch (error) {
        console.error('Error in uploadProfilePhoto API:', error);
        return NextResponse.json(
            { 
                error: 'Failed to upload photo',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
} 