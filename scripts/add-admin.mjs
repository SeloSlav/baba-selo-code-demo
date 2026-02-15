#!/usr/bin/env node
/**
 * Add an admin user to Firestore.
 * Run: npm run add-admin
 * Or: node scripts/add-admin.mjs [uid]
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY in .env.local
 */
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load .env.local or .env
for (const name of ['.env.local', '.env']) {
  const envPath = join(rootDir, name);
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const ADMIN_UID = process.env.ADMIN_UID || process.argv[2] || '56cikef5nPRltmm0RBufeqFCSJK2';

async function main() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) {
    console.error('FIREBASE_SERVICE_ACCOUNT_KEY not set. Add it to .env.local or set the env var.');
    process.exit(1);
  }

  if (!admin.apps.length) {
    const serviceAccount = JSON.parse(key);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  }

  const db = admin.firestore();
  await db.collection('admins').doc(ADMIN_UID).set({
    active: true,
    addedAt: admin.firestore.FieldValue.serverTimestamp(),
    addedBy: ADMIN_UID,
    userId: ADMIN_UID,
    username: 'seloslav',
  });

  console.log(`Admin added: ${ADMIN_UID} (seloslav)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
