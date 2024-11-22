"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Users, Music2, Plus } from "lucide-react";
import { CreateGroupModal } from "@/components/ui/create-group-modal";
import { GroupCard } from "@/components/ui/group-card";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from '@/lib/firebase';
import { addDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';
import  Image  from 'next/image';


export default function ProfilePage() {
 const { data: session } = useSession();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [groups, setGroups] = useState([]);

  const handleCreateGroup = async (groupName) => {
    const group = {
        name: groupName,
        members: [session.user.userId],
        created_at: new Date(),
        admin: session.user.userId,
        playlists: [],
        };
        //create the doc and get the group id back
        await addDoc(collection(db, 'groups'), group);
  };



  useEffect(() => {
    const fetchGroups = async () => {
      if (session && session.user) {
        console.log("user Data", session.user);
        console.log("User ID:", session.user.userId);
        const q = query(collection(db, 'groups'), where('members', 'array-contains', session.user.userId));
        const querySnapshot = await getDocs(q);
        const fetchedGroups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log('fetched groups', fetchedGroups);
        setGroups(fetchedGroups);
      }
    };

    fetchGroups();
  }, [session]);

  if(session === undefined) {
    return <Skeleton />;
  }

  if(session === null) {
    return <div>Access Denied</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-black via-neutral-900 to-neutral-900 pt-24">
      {/* Profile Section */}
      <div className="px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Profile Info */}
            <Card className="w-full md:w-1/3 bg-neutral-800 border-neutral-700 p-6">
              <div className="flex flex-col items-center text-center">
                <div className="w-24 h-24 bg-neutral-700 rounded-full flex items-center justify-center mb-4">
                  <Image src={session.user.image} alt={session.user.name} width={96} height={96} className="rounded-full" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2"></h2>
                <p className="text-gray-400 mb-4">{session.user.name}</p>
                <Button className="w-full bg-[#1DB954] hover:bg-[#1ed760]">
                  Edit Profile
                </Button>
              </div>
              
              <div className="mt-6 pt-6 border-t border-neutral-700">
                <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-[#1DB954]">5</p>
                    <p className="text-sm text-gray-400">Active Groups</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#1DB954]">12</p>
                    <p className="text-sm text-gray-400">Playlists</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* My Groups Section */}
            <div className="w-full md:w-2/3">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">My Groups</h2>
                <Button 
                  className="bg-[#1DB954] hover:bg-[#1ed760]"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" /> Create Group
                </Button>
              </div>
              
              <div className="grid gap-4">
                {/* Active Group Cards */}
                {groups.map(group => (
                  <GroupCard
                    key={group.id}
                    groupName={group.name}
                    membersCount={group.members.length}
                    updatedTime="5 days ago"
                    groupId={group.id}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CreateGroupModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onSubmit={handleCreateGroup}
      />



    </main>
  );
}