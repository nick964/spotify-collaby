import { Button } from "../ui/button";
import Link from "next/link";
import { Music2 } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed w-full z-50 top-0 flex items-center justify-between px-6 py-3 bg-black/95 backdrop-blur-sm border-b border-neutral-800">
      <Link href="/" className="flex items-center space-x-2">
        <Music2 className="h-6 w-6 text-[#1DB954]" />
        <span className="font-bold text-white">Spotify Social</span>
      </Link>
      
      <div className="flex items-center space-x-4">
        <Button className="bg-[#1DB954] hover:bg-[#1ed760]">
          Login
        </Button>
      </div>
    </nav>
  );
}