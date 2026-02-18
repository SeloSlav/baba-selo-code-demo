import * as admin from 'firebase-admin';

const serviceAccountKeyJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const storageBucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

let serviceAccount;
if (serviceAccountKeyJson) {
  try {
    serviceAccount = JSON.parse(serviceAccountKeyJson);
  } catch (error) {
    console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON:", error);
    serviceAccount = null;
  }
}

// Prevent initializing the app multiple times
if (!admin.apps.length) {
  if (serviceAccount?.project_id && storageBucketName) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id,
        storageBucket: storageBucketName
      });
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