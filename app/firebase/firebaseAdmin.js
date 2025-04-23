import * as admin from 'firebase-admin';

// Read the service account key JSON from the environment variable
const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
// Read storage bucket name from environment variable
const storageBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

console.log("Attempting to load FIREBASE_SERVICE_ACCOUNT_KEY...");

let serviceAccount;
if (serviceAccountKeyJson) {
  console.log("FIREBASE_SERVICE_ACCOUNT_KEY found, attempting to parse...");
  try {
    serviceAccount = JSON.parse(serviceAccountKeyJson);
    console.log(`Parsed service account JSON. Project ID: ${serviceAccount?.project_id}`);
  } catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:", error);
    serviceAccount = null;
  }
} else {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.");
}

// Prevent initializing the app multiple times
if (!admin.apps.length) {
  if (serviceAccount && serviceAccount.project_id && storageBucketName) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        storageBucket: storageBucketName
      });
      console.log("Firebase Admin SDK initialized successfully (with explicit projectId and storageBucket).");
    } catch (error) {
      console.error("Firebase Admin SDK initialization error:", error);
      console.error("Initialization attempted with Project ID:", serviceAccount.project_id, "Client Email:", serviceAccount.client_email, "Storage Bucket:", storageBucketName);
    }
  } else {
    console.log("Firebase Admin SDK NOT initialized due to missing config (service account key, project ID, or storage bucket).");
  }
} else {
    // Optional: Log if already initialized
    // console.log("Firebase Admin SDK already initialized.");
}

// Export the initialized admin instance
export { admin }; 