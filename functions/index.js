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

exports.runPlaylistCompiler = onRequest(async (req, res) => {
  try {
    logger.info("Running playlist compiler");
    logger.info(JSON.stringify(req.body));
    const groupId = req.body.groupId;
    const result = await runSpotifyPlayListCompiler(groupId);
    res.status(200).json(result);
  } catch (error) {
    logger.error(JSON.stringify(error.message));
    res.status(400).json({ error: error.message });
  }
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

async function runSpotifyPlayListCompiler(groupId) {
  if (!groupId) {
    throw new Error('Missing groupId in request body');
  }

  // Fetch the group document
  const groupDoc = await admin.firestore().collection('groups').doc(groupId).get();
  if (!groupDoc.exists) {
    throw new Error(`Group with ID ${groupId} not found`);
  }

  const groupData = groupDoc.data();
  const { members, name: groupName, admin: adminId, playlistId: existingPlaylistId } = groupData;

  if (!members || members.length === 0) {
    throw new Error(`Group "${groupName}" has no members.`);
  }

  const currentWeek = getCurrentWeekString();
  let playlistId = existingPlaylistId;

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  if (playlistId) {
    console.log(`Playlist already exists for group "${groupName}". Clearing and repopulating.`);
    try {
      const ownerDoc = await admin.firestore().collection('users').doc(adminId).get();
      const ownerData = ownerDoc.data();

      if (!ownerData || !ownerData.access_token) {
        throw new Error(`Owner ${adminId} does not have an access token.`);
      }

      await clearAndRenamePlaylist(ownerData.access_token, playlistId, `${groupName} Weekly Playlist - ${currentWeek}`);
    } catch (error) {
      console.error(`Error managing existing playlist:`, error.message);
      throw new Error(`Error managing existing playlist for group "${groupName}".`);
    }
  } else {
    console.log(`Creating new playlist for group "${groupName}".`);
    try {
      playlistId = await createNewPlaylist(groupId, adminId, groupName, currentWeek);
    } catch (error) {
      console.error(`Error creating new playlist:`, error.message);
      throw new Error(`Error creating new playlist for group "${groupName}".`);
    }
  }

  // Fetch and add songs for each member
  const addedSongs = new Set();
  for (const memberId of members) {
    const userDoc = await admin.firestore().collection('users').doc(memberId).get();
    const userData = userDoc.data();

    if (!userData || !userData.access_token) {
      console.log(`User ${memberId} does not have an access token.`);
      continue;
    }

    try {
      const userSongs = await fetchUserRecentlyPlayed(userData.access_token, oneWeekAgo);
      const uniqueSongs = userSongs.filter((song) => !addedSongs.has(song));
      uniqueSongs.forEach((song) => addedSongs.add(song));

      if (uniqueSongs.length > 0) {
        await addSongsToPlaylist(userData.access_token, playlistId, uniqueSongs);
        console.log(`Added ${uniqueSongs.length} songs for user "${memberId}".`);
      }
    } catch (error) {
      console.error(`Error adding songs for user "${memberId}":`, error.message);
    }
  }

  // Ensure members follow the playlist
  await Promise.all(
    members.map(async (memberId) => {
      const userDoc = await admin.firestore().collection('users').doc(memberId).get();
      const userData = userDoc.data();

      if (!userData || !userData.access_token) {
        console.log(`User ${memberId} does not have an access token.`);
        return;
      }

      try {
        await ensureUserFollowsPlaylist(userData.access_token, playlistId);
        console.log(`Ensured user "${memberId}" follows playlist "${playlistId}".`);
      } catch (error) {
        console.error(`Error ensuring user "${memberId}" follows playlist:`, error.message);
      }
    })
  );

  return { message: `Playlist "${playlistId}" updated successfully.` };
}

async function clearAndRenamePlaylist(accessToken, playlistId, newName) {
  const tracksResponse = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const tracks = tracksResponse.data.items || [];
  const trackUris = tracks.map((track) => ({ uri: track.track.uri }));

  if (trackUris.length > 0) {
    await axios.delete(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: { tracks: trackUris },
    });
  }

  await axios.put(
    `https://api.spotify.com/v1/playlists/${playlistId}`,
    { name: newName, description: `Updated playlist for ${newName}.` },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

async function fetchUserRecentlyPlayed(accessToken, after) {
  const response = await axios.get('https://api.spotify.com/v1/me/player/recently-played', {
    headers: { Authorization: `Bearer ${accessToken}` },
    params: { limit: 50, after },
  });

  return response.data.items.map((item) => item.track.uri);
}

async function addSongsToPlaylist(accessToken, playlistId, uris) {
  const batchedUris = chunkArray(uris, 100); // Spotify accepts up to 100 URIs per request
  for (const batch of batchedUris) {
    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      { uris: batch },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
  }
}

async function ensureUserFollowsPlaylist(accessToken, playlistId) {
  await axios.put(
    `https://api.spotify.com/v1/playlists/${playlistId}/followers`,
    { public: false },
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
}

function chunkArray(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}




// Utility function to get the current week's name
function getCurrentWeekString() {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Monday
  const endOfWeek = new Date(now.setDate(now.getDate() + 6)); // Sunday
  return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
}
