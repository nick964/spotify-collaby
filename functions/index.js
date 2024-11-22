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

  let allSongs = [];
  const currentWeek = getCurrentWeekString(); // Utility function to get the week's name
  let playlistId = existingPlaylistId;

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  if (playlistId) {
    console.log(`Playlist already exists for group "${groupName}". Clearing and repopulating.`);

    // Fetch and remove all playlist tracks
    try {
      const ownerDoc = await admin.firestore().collection('users').doc(adminId).get();
      const ownerData = ownerDoc.data();

      if (!ownerData || !ownerData.access_token) {
        throw new Error(`Owner ${adminId} does not have an access token.`);
      }

      // Fetch all tracks from the existing playlist
      const tracksResponse = await axios.get(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
        {
          headers: {
            Authorization: `Bearer ${ownerData.access_token}`,
          },
        }
      );

      const tracks = tracksResponse.data.items || [];
      const trackUris = tracks.map((track) => ({ uri: track.track.uri }));

      if (trackUris.length > 0) {
        await axios.delete(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
          {
            headers: {
              Authorization: `Bearer ${ownerData.access_token}`,
              'Content-Type': 'application/json',
            },
            data: { tracks: trackUris },
          }
        );
        console.log(`Cleared ${trackUris.length} tracks from playlist "${playlistId}".`);
      }

      // Update playlist name
      await axios.put(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
          name: `${groupName} Weekly Playlist - ${currentWeek}`,
          description: `A playlist for the week of ${currentWeek}.`,
          public: false,
        },
        {
          headers: {
            Authorization: `Bearer ${ownerData.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`Updated playlist name to "${groupName} Weekly Playlist - ${currentWeek}".`);
    } catch (error) {
      console.error(`Error managing existing playlist:`, error.message);
      throw new Error(`Error managing existing playlist for group "${groupName}".`);
    }
  } else {
    console.log(`Creating new playlist for group "${groupName}".`);

    // Create a new playlist
    const ownerDoc = await admin.firestore().collection('users').doc(adminId).get();
    const ownerData = ownerDoc.data();

    if (!ownerData || !ownerData.access_token) {
      throw new Error(`Owner ${adminId} does not have an access token.`);
    }

    try {
      const playlistResponse = await axios.post(
        `https://api.spotify.com/v1/users/${ownerData.spotifyId}/playlists`,
        {
          name: `${groupName} Weekly Playlist - ${currentWeek}`,
          description: `A playlist for the week of ${currentWeek}.`,
          public: false,
        },
        {
          headers: {
            Authorization: `Bearer ${ownerData.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      playlistId = playlistResponse.data.id;

      // Update Firestore with the new playlist ID
      await admin.firestore().collection('groups').doc(groupId).update({
        playlistId,
      });

      console.log(`Created new playlist with ID "${playlistId}" for group "${groupName}".`);
    } catch (error) {
      console.error(`Error creating new playlist:`, error.message);
      throw new Error(`Error creating new playlist for group "${groupName}".`);
    }
  }

  // Fetch and compile songs
  for (const memberId of members) {
    const userDoc = await admin.firestore().collection('users').doc(memberId).get();
    const userData = userDoc.data();

    if (!userData || !userData.access_token) {
      console.log(`User ${memberId} does not have an access token.`);
      continue;
    }

    try {
      const recentTracksResponse = await axios.get(
        'https://api.spotify.com/v1/me/player/recently-played',
        {
          headers: {
            Authorization: `Bearer ${userData.access_token}`,
          },
          params: {
            limit: 50,
            after: oneWeekAgo,
          },
        }
      );

      const recentTracks = recentTracksResponse.data.items || [];
      const userSongs = recentTracks.map((track) => track.track.uri);

      const selectedSongs = shuffleArray(userSongs).slice(0, 20);
      allSongs = allSongs.concat(selectedSongs);
    } catch (error) {
      console.error(`Error fetching listening history for user ${memberId}:`, error.message);
    }
  }

  // Add songs to the playlist
  try {
    const ownerDoc = await admin.firestore().collection('users').doc(adminId).get();
    const ownerData = ownerDoc.data();

    await axios.post(
      `https://api.spotify.com/v1/playlists/${playlistId}/tracks`,
      {
        uris: allSongs,
      },
      {
        headers: {
          Authorization: `Bearer ${ownerData.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`Added ${allSongs.length} songs to playlist "${playlistId}".`);
  } catch (error) {
    console.error(`Error adding tracks to playlist:`, error.message);
    throw new Error(`Error adding tracks to playlist "${playlistId}".`);
  }

  // Ensure members follow the playlist
  for (const memberId of members) {
    const userDoc = await admin.firestore().collection('users').doc(memberId).get();
    const userData = userDoc.data();

    if (!userData || !userData.access_token) {
      console.log(`User ${memberId} does not have an access token.`);
      continue;
    }

    try {
      await axios.put(
        `https://api.spotify.com/v1/playlists/${playlistId}/followers`,
        { public: false },
        {
          headers: {
            Authorization: `Bearer ${userData.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      console.log(`Ensured user "${memberId}" follows playlist "${playlistId}".`);
    } catch (error) {
      console.error(`Error ensuring user "${memberId}" follows the playlist:`, error.message);
    }
  }

  return { message: `Playlist "${playlistId}" updated successfully.` };
}



// Utility function to shuffle an array
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}


// Utility function to get the current week's name
function getCurrentWeekString() {
  const now = new Date();
  const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + 1)); // Monday
  const endOfWeek = new Date(now.setDate(now.getDate() + 6)); // Sunday
  return `${startOfWeek.toLocaleDateString()} - ${endOfWeek.toLocaleDateString()}`;
}
