import { Button } from "../ui/button";
import Link from "next/link";
import { Music2 } from "lucide-react";

export function Navbar() {

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
    <nav className="fixed w-full z-50 top-0 flex items-center justify-between px-6 py-3 bg-black/95 backdrop-blur-sm border-b border-neutral-800">
      <Link href="/" className="flex items-center space-x-2">
        <Music2 className="h-6 w-6 text-[#1DB954]" />
        <span className="font-bold text-white">Spotify Social</span>
      </Link>
      
      <div className="flex items-center space-x-4">
        <Button className="bg-[#1DB954] hover:bg-[#1ed760]" onClick={handleLogin}>
          Login
        </Button>
      </div>
    </nav>
  );
}