"use client";

import { useEffect, useState } from 'react';
import React from 'react';
import { useSession } from 'next-auth/react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export default function SignedUpPage() {
    const { data: session, status } = useSession();
    const [group, setGroup] = useState(null); // Initialize the group state

    useEffect(() => {
        const addUserToGroup = async () => {
            try {
                const groupId = localStorage.getItem('groupId');
                console.log('logging out group id in client component', groupId);
                if (groupId && session) {
                    const userId = session.user.userId;
                    const docRef = doc(db, 'groups', groupId);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const group = docSnap.data();
                        const members = group.members || [];
                        console.log('members', members);

                        // Check if the user is already in the group
                        if (!members.includes(userId)) {
                            members.push(userId);
                            await updateDoc(docRef, { members });
                            setGroup({ ...group, members }); // Update group state if needed
                        } else {
                            console.log('User already in group');
                        }
                    } else {
                        console.log('No such document!');
                    }
                }
            } catch (err) {
                console.log('Error getting document:', err);
            }
        };

        addUserToGroup();
    }, [session]);

    return (
        <div>
            <h1>You have signed up!</h1>
            {group && <p>Group data loaded: {JSON.stringify(group)}</p>}
        </div>
    );
}
