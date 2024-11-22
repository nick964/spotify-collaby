import React from 'react';
import { useState, useEffect } from "react";
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InviteUserModal } from "@/components/ui/invite-user-modal";
import { Users, Music2, Plus } from "lucide-react";

export function GroupCard({ groupName, membersCount, updatedTime, groupId }) {

  const handleInviteUser = async (email) => {
    try {
      console.log('Inviting user in group card:', email);
      console.log('Inviting user in group id:', groupId);
      const requestBody = JSON.stringify({
        email,
        groupId,
      });
      const response = await fetch('/api/invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      const result = await response.json();
  
      if (!response.ok) {
        console.error('Error inviting user:', result.error);
        alert(`Failed to send invite: ${result.error}`);
        return;
      }
  
      // Display success message
      console.log('Invite link:', result.message);
      alert(`Invite sent successfully! Invite link: ${result.message}`);
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Something went wrong while sending the invite. Please try again.');
    }
  };

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  return (
    <main>
    <Card className="bg-neutral-800 border-neutral-700 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-12 w-12 bg-neutral-700 rounded-lg flex items-center justify-center">
            <Users className="h-6 w-6 text-[#1DB954]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{groupName}</h3>
            <p className="text-sm text-gray-400">{membersCount} members • Updated {updatedTime}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" className="bg-[#1DB954] border-neutral-600 text-white hover:bg-neutral-700">
            View Group
          </Button>
          <Button variant="outline" 
          className="bg-[#1DB954] border-neutral-600 text-white hover:bg-neutral-700"
          onClick={() => setIsInviteModalOpen(true)}
          >
            Invite
          </Button>
        </div>
      </div>
    </Card>

    <InviteUserModal
      open={isInviteModalOpen}
      onOpenChange={setIsInviteModalOpen}
      onSubmit={handleInviteUser}
      groupId={groupId}
    />
    </main>

  );
};
