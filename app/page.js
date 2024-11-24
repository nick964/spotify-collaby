import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Music, Sparkles, ArrowRight, PlayCircle } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-neutral-900 pt-16">
      {/* Hero Section */}
      <div className="relative px-6 lg:px-8">
        <div className="mx-auto max-w-6xl pt-20 pb-32 sm:pt-48 sm:pb-40">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Yoooo
              <span className="text-[#1DB954] block">What we listening to?</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-300">
              Automatically generate Spotify playlists that perfectly blend everyone's music taste.
              Based on what you and your friends have been listening to lately.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" className="bg-[#1DB954] hover:bg-[#1ed760]">
                Get Started <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-neutral-900 py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-[#1DB954]">
              How It Works
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Create the Perfect Group Playlist
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <Card className="bg-neutral-800 border-neutral-700">
                <div className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1DB954]">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold leading-7 text-white">
                      Connect Friends
                    </h3>
                    <p className="mt-4 text-base leading-7 text-gray-300">
                      Link your Spotify accounts and invite your friends to join your music circle.
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="bg-neutral-800 border-neutral-700">
                <div className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1DB954]">
                    <Music className="h-6 w-6 text-white" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold leading-7 text-white">
                      Analyze Tastes
                    </h3>
                    <p className="mt-4 text-base leading-7 text-gray-300">
                      Our algorithm analyzes everyone's recent listening history and preferences.
                    </p>
                  </div>
                </div>
              </Card>
              <Card className="bg-neutral-800 border-neutral-700">
                <div className="p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#1DB954]">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold leading-7 text-white">
                      Generate Playlist
                    </h3>
                    <p className="mt-4 text-base leading-7 text-gray-300">
                      Get a perfectly curated playlist that everyone will love, updated weekly.
                    </p>
                  </div>
                </div>
              </Card>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-neutral-900">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to create your group playlist?
              <br />
              Get started in seconds
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-300">
              Connect your Spotify account now and invite your friends to create the perfect shared music experience.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button size="lg" className="bg-[#1DB954] hover:bg-[#1ed760]">
                <PlayCircle className="mr-2 h-4 w-4" /> Start Creating
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}