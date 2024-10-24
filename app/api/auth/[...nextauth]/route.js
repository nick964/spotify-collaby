import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

export const authOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID,
      clientSecret: process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_SECRET,
      authorization: `https://accounts.spotify.com/authorize?scope=${encodeURIComponent('user-read-private user-read-email user-library-read user-library-modify playlist-read-private playlist-modify-public playlist-modify-private user-read-recently-played')}`,
    }),
  ],
  callbacks: {
    async jwt(token, user, account, profile, isNewUser) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session(session, token) {
      session.id = token.id;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
