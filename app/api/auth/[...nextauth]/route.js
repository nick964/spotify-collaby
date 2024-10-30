import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";
import { db } from '../../../../lib/firebase';  // Ensure this points to your Firebase setup
import { addDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';

export const authOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET,
      authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent('user-read-private user-read-email user-library-read user-library-modify playlist-read-private playlist-modify-public playlist-modify-private user-read-recently-played')}`,
      
      
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        console.log("I am in jwt");
        // Access and refresh tokens from Spotify
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;

        // Save user details in Firestore
        const currentDate = new Date();
        let fiftyMinutesInMs = 50 * 60 * 1000;
        const needs_refresh = new Date(currentDate.getTime() + fiftyMinutesInMs);

        const user = {
          spotifyId: profile.id,
          email: profile.email,
          display_name: profile.display_name,
          access_token: account.access_token,
          refresh_token: account.refresh_token,
          expires_in: account.expires_at,
          profilePic: profile.image_url || '',
          created_at: currentDate,
          updated_at: currentDate,
          needs_refresh: needs_refresh,
        };

        // Check if user already exists in Firestore
        const querySnapshot = await getDocs(query(collection(db, 'users'), where('spotifyId', '==', profile.id)));

        let firebaseUserRef;
        if (!querySnapshot.empty) {
          // Update the existing user with new access/refresh token details
          const userRef = querySnapshot.docs[0].ref;
          const firebaseUser = await updateDoc(userRef, {
            access_token: account.access_token,
            refresh_token: account.refresh_token,
            expires_in: account.expires_at,
            updated_at: currentDate,
            needs_refresh: needs_refresh,
          });
          firebaseUserRef = userRef.id;
        } else {
          // Add new user to Firestore
          const newUserRef = await addDoc(collection(db, 'users'), user);
          firebaseUserRef = newUserRef.id;
        }
        console.log("logging firebase user ref", firebaseUserRef);
        token.userId = firebaseUserRef;
        console.log(token);
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;

      
      session.user.userId = token.userId;
      console.log('adding token to session', session);
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Redirect to a new page after successful login
      return baseUrl + '/profile';  // Replace with your desired page
    }
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
