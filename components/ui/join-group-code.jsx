'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, Music2, Calendar, Loader2 } from 'lucide-react';
import Image from 'next/image';

// Helper function to format Firestore Timestamp
const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp.seconds * 1000); // Convert seconds to milliseconds
  return date.toLocaleDateString(); // Format date as needed
};

export function JoinGroupCode() {
  const [isLoading, setIsLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (groupId && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      const fetchGroup = async () => {
        try {
          const docRef = doc(db, 'groups', groupId);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            localStorage.setItem('groupId', groupId);
            const myGroup = docSnap.data();
            myGroup.createdAt = formatTimestamp(myGroup.created_at);
            setGroup(myGroup);
          } else {
            setError('Group not found');
          }
        } catch (err) {
          console.error('Error fetching group:', err);
          setError('Failed to load group information');
        } finally {
          setIsLoading(false);
        }
      };

      fetchGroup();
    }
  }, [groupId]);

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-neutral-900 pt-24 px-4">
        <Card className="max-w-md mx-auto bg-neutral-800 border-neutral-700 p-6 text-center">
          <div className="text-red-400 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{error}</h2>
          <p className="text-gray-400 mb-4">The group you're looking for couldn't be found or there was an error loading it.</p>
          <Button className="bg-[#1DB954] hover:bg-[#1ed760]" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-neutral-900 pt-24 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#1DB954] mx-auto" />
          <p className="text-white mt-4">Loading group information...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-neutral-900 pt-24 px-4">
      <Card className="max-w-2xl mx-auto bg-neutral-800 border-neutral-700">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-20 h-20 bg-neutral-700 rounded-full flex items-center justify-center">
                <Music2 className="h-10 w-10 text-[#1DB954]" />
              </div>
            </div>
            
            <div className="flex-grow text-center sm:text-left">
              <h1 className="text-2xl font-bold text-white mb-2">{group?.name}</h1>
              <p className="text-gray-400 mb-6">{group?.description}</p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-400">
                  <Users className="h-5 w-5 text-[#1DB954]" />
                  <span>{group?.members.length} members</span>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-400">
                  <Calendar className="h-5 w-5 text-[#1DB954]" />
                  <span>Created {group?.createdAt}</span>
                </div>
              </div>

              <div className="border-t border-neutral-700 pt-6 mb-6">
                <div className="flex items-center gap-4 mb-6">
                  <div>
                    <p className="text-gray-400">Invited by</p>
                    <p className="text-white font-semibold">me</p>
                  </div>
                </div>
              </div>

              <Button 
                className="w-full sm:w-auto bg-[#1DB954] hover:bg-[#1ed760]"
                onClick={() => signIn('spotify')}
              >
                Join with Spotify
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </main>
  );
}