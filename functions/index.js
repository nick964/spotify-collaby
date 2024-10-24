/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// The Cloud Functions for Firebase SDK to set up triggers and logging.
const {onSchedule} = require("firebase-functions/v2/scheduler");
const { defineString } = require('firebase-functions/params');
const {logger} = require("firebase-functions");
const { onRequest } = require("firebase-functions/v2/https");

const axios = require("axios");
const admin = require("firebase-admin");
const qs = require('qs');

const { log } = require("firebase-functions/logger");
admin.initializeApp();  

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

const CLIENT_ID = defineString("NEXT_PUBLIC_SPOTIFY_CLIENT_ID");
const CLIENT_SECRET = defineString("NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET");

exports.refreshTokens = onSchedule("every 2 minutes", async (event) => {
  await runRefreshTokens();
});

//Add a onRequest function to call my refreshTokens function
exports.refreshTokensRequest = onRequest(async (req, res) => {
  await runRefreshTokens();
  res.send("Refreshed tokens");
});



async function refreshUserToken(user) {
  if(user) {
    try {
      const client_id = CLIENT_ID.value();
      const client_secret = CLIENT_SECRET.value();
      const base64Code = ("Basic " + (new Buffer.from(client_id + ':' + client_secret).toString('base64')));
      const userId = user.id;
      const requestData = qs.stringify({
        grant_type: "refresh_token",
        refresh_token: user.refresh_token
      });
      const response = await axios.post("https://accounts.spotify.com/api/token", requestData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Authorization": base64Code
        }
      });
      logger.info('logging out spotify response', response.data);
      const newAccessToken = response.data["access_token"];
      var currentDate = new Date();
      let fiftyMinutesInMs = 50 * 60 * 1000;
      var newRefreshTime = new Date(currentDate.getTime() + fiftyMinutesInMs);
      await admin.firestore().collection("users").doc(`${userId}`).update({
        access_token: newAccessToken,
        updated_at: currentDate,
        needs_refresh: newRefreshTime,
      });
      return newAccessToken;
    } catch (error) {
      //log out the response body from this 400 error response
      logger.error(JSON.stringify(error.response.data));
      logger.error(JSON.stringify(error));
      throw error;
    }
  } else {
    throw new Error("User not found");
  }
}

async function runRefreshTokens() {
  logger.info("running runRefreshTokens at " + new Date().toISOString()); 
  const now = new Date();
  const inactiveUsers = await admin.firestore().collection("users").where("needs_refresh", "<=", now).get();
  logger.info(`Found ${inactiveUsers.size} inactive users`);
  if(inactiveUsers.empty) {
    logger.info("No inactive users found");
    return;
  }

  const promises = inactiveUsers.docs.map((user) => {
    const userData = user.data();
    const inactUser = {
      "id": user.id,
      ...userData
    }
    logger.info(`Refreshing user ${inactUser.id}`);
    return refreshUserToken(inactUser);
  });
  try {
    await Promise.all(promises);
    logger.info(`Successfully refreshed ${promises.length} users`);
  } catch (error) {
    logger.error(`Error refreshing tokens: ${error}`);
  }
}