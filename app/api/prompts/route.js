import { NextResponse } from 'next/server';
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';

// Helper function to store a prompt
const storePrompt = async (data) => {
  try {
    const promptData = {
      ...data,
      timestamp: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, 'prompts'), promptData);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error storing prompt:', error.code || error.message);
    return { success: false, error: error.message };
  }
};

// GET endpoint to retrieve prompts (with optional filtering)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const promptType = searchParams.get('type');
    const maxResults = parseInt(searchParams.get('limit') || '100');
    
    // Build query with filters
    let promptsQuery = collection(db, 'prompts');
    let constraints = [];
    
    if (userId) {
      constraints.push(where('userId', '==', userId));
    }
    
    if (promptType) {
      constraints.push(where('type', '==', promptType));
    }
    
    // Add ordering and limit
    constraints.push(orderBy('timestamp', 'desc'));
    constraints.push(limit(maxResults));
    
    // Execute query
    const querySnapshot = await getDocs(query(promptsQuery, ...constraints));
    
    // Format results
    const prompts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.() || null
    }));
    
    return NextResponse.json({ prompts });
  } catch (error) {
    console.error('Error fetching prompts:', error.code || error.message);
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    );
  }
}

// POST endpoint to store a new prompt
export async function POST(req) {
  try {
    const data = await req.json();
    
    // Validate required fields
    if (!data.message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    const result = await storePrompt({
      userId: data.userId || 'anonymous',
      message: data.message,
      conversationHistory: data.conversationHistory || [],
      type: data.type || 'general',
      metadata: data.metadata || {},
    });
    
    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        id: result.id,
        message: 'Prompt stored successfully' 
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing prompt storage:', error.code || error.message);
    return NextResponse.json(
      { error: 'Failed to process prompt' },
      { status: 500 }
    );
  }
} 