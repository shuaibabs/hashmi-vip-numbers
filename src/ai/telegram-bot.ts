/**
 * @fileoverview This file contains the backend logic for a Telegram bot that interacts
 * with the Hashmi VIP Numbers application. It uses Cloud Functions for Firebase to
 * create a secure webhook endpoint that listens for commands from Telegram.
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize the Firebase Admin SDK.
// It's important to initialize only once.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

/**
 * This is the main entry point for the Telegram bot. It's an HTTP-triggered Cloud
 * Function that Telegram will call whenever a user sends a message to the bot.
 *
 * To make this work, you need to:
 * 1. Deploy this function to Firebase.
 * 2. Get the public URL of the deployed function.
 * 3. Set this URL as the webhook for your Telegram bot using the Telegram Bot API.
 */
export const telegramWebhook = functions.https.onRequest(async (req, res) => {
  // Security: We must verify that the request is coming from Telegram.
  // We'll use a secret token that we set when registering the webhook.
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const secretToken = req.header('X-Telegram-Bot-Api-Secret-Token');

  if (secretToken !== functions.config().telegram.secret) {
    console.error('Invalid secret token.');
    res.status(403).send('Forbidden');
    return;
  }

  const update = req.body;
  const message = update.message;

  if (message && message.text) {
    const chatId = message.chat.id;
    const command = message.text.toLowerCase();

    // Here is where we will handle different bot commands.
    // For now, we'll just send a simple acknowledgment.
    let responseText = 'Command received!';

    if (command === '/start') {
      responseText =
        'Welcome to the Hashmi VIP Numbers bot! Send /help to see available commands.';
    } else {
      // TODO: Implement command handling logic (e.g., /login, /addnumber, etc.)
      responseText = `Command '${command}' is not yet implemented.`;
    }

    // Send a response back to the user via the Telegram API.
    await sendTelegramMessage(chatId, responseText);
  }

  // Acknowledge the request from Telegram.
  res.status(200).send('OK');
});

/**
 * A helper function to send a message back to a user through the Telegram Bot API.
 * @param chatId The ID of the chat to send the message to.
 * @param text The text of the message to send.
 */
async function sendTelegramMessage(chatId: number, text: string) {
  const telegramToken = functions.config().telegram.token;
  if (!telegramToken) {
    console.error('Telegram bot token is not configured.');
    return;
  }

  const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });
    const jsonResponse = await response.json();
    if (!jsonResponse.ok) {
      console.error(
        'Failed to send message to Telegram:',
        jsonResponse.description
      );
    }
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
  }
}
