
/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onDocumentDeleted} from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

// Initialize admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// For cost control, you can set the maximum number of containers that can be
// running at the same time.
setGlobalOptions({ maxInstances: 10 });

/**
 * Deletes a user from Firebase Authentication when their corresponding document
 * is deleted from the 'users' collection in Firestore.
 */
export const onUserDeleted = onDocumentDeleted("users/{userId}", async (event) => {
  const userId = event.params.userId;
  try {
    await admin.auth().deleteUser(userId);
    console.log(`Successfully deleted user with ID: ${userId} from Firebase Auth.`);
  } catch (error) {
    console.error(`Error deleting user with ID: ${userId} from Firebase Auth:`, error);
  }
});
