import axios from 'axios';

import { db } from '../../../../lib/firebase';
import { addDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';

export async function GET(request) {
  // Get query params from request.
  const {searchParams} = new URL(request.url)
  const client_id = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
  const client_secret = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET;
  const base64Code = ("Basic " + (new Buffer.from(client_id + ':' + client_secret).toString('base64')));

  const unsanitizedCode = searchParams.get('code') || ''
  const code = encodeURI(unsanitizedCode)

  if (!code) {    
    return new Response(JSON.stringify({ error: 'Missing authorization code' }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
  }

  try {
    console.log('trying  request');
    console.log('logging out base64Code', base64Code);
    const spotifyResponse = await axios.post('https://accounts.spotify.com/api/token', 
    {
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI
    }, 
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': base64Code, 
      },
    });

    console.log('logging out spotify response', spotifyResponse.data);

    //Get details from spotify
    const spotifyUser = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': `Bearer ${spotifyResponse.data.access_token}`,
      },
    });

    //get profile pic
    const images = spotifyUser.data.images;

    const sortedImages = images.sort((a, b) => { b.width - a.width });

    const pic = sortedImages[0].url;

    var currentDate = new Date();
    let fiftyMinutesInMs = 50 * 60 * 1000;
    var needs_refresh = new Date(currentDate.getTime() + fiftyMinutesInMs);
    // Save user in firebase
    const user = {
      spotifyId: spotifyUser.data.id,
      email: spotifyUser.data.email,
      display_name: spotifyUser.data.display_name,
      access_token: spotifyResponse.data.access_token,
      refresh_token: spotifyResponse.data.refresh_token,
      expires_in: spotifyResponse.data.expires_in,
      profilePic: pic,
      created_at: currentDate,
      updated_at: currentDate,
      needs_refresh: needs_refresh,
    };
    console.log('logging out user', user);

    // Check if user already exists
    const querySnapshot = await getDocs(query(collection(db, 'users'), where('spotifyId', '==', spotifyUser.data.id)));

    if (!querySnapshot.empty) {
      //Get User and update access_token and refresh_token
      const userRef = querySnapshot.docs[0].ref;
      await updateDoc(userRef, {
        access_token: spotifyResponse.data.access_token,
        refresh_token: spotifyResponse.data.refresh_token,
        expires_in: spotifyResponse.data.expires_in,
        updated_at: currentDate,
        needs_refresh: needs_refresh,
      });
    } else {
      const docRef = await addDoc(collection(db, 'users'), user);
      console.log("Document written with ID: ", docRef.id);
    }

    // Return a success response with the data from Spotify
    return new Response(JSON.stringify(spotifyResponse.data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.log('logging out in error!');
    console.log(error);
    if(error.response && error.response.data) {
      console.log(error.response.data);
      return new Response(JSON.stringify(error.response.data), {
        status: error.response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }


  }
}
