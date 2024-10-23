"use client"

import { useRouter } from 'next/navigation';

const SpotifyLogin = () => {
    const router = useRouter();

    const handleLogin = () => {
        // Redirect user to Spotify authorization page
        const authorizeUrl = `https://accounts.spotify.com/authorize?` +
        `client_id=${process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI)}` +
        `&scope=user-read-private%20user-read-email%20user-library-read%20user-library-modify%20playlist-read-private%20playlist-modify-public%20playlist-modify-private%20user-read-recently-played`;
        console.log('logging out authorizeUrl', authorizeUrl);
        window.location.href = authorizeUrl; // Redirects the user to Spotify
    };

    return (
        <div>
            <button onClick={handleLogin}>
                Login with Spotify
            </button>
            
        </div>
    );
};

export default SpotifyLogin;
