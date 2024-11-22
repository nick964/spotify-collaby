import axios from 'axios';

import { db } from '@/lib/firebase';
import { authOptions } from '../auth/[...nextauth]';
import { addDoc, getDocs, collection, query, where, updateDoc, doc, getDoc } from 'firebase/firestore';

export async function POST(request) {

    const { email, groupId } = await request.json();
    console.log('Inviting user on server', email);
    console.log('Inviting group on server group id:', groupId);
    
    if (!email || !groupId) {    
        return new Response(JSON.stringify({ error: 'Missing email or groupId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        });
    }
    
    try {
        //get group code from firebase based on doc id
        const groupRef = doc(db, 'groups', groupId);
        const groupDoc = await getDoc(groupRef);
        const groupData = groupDoc.data();

        if (!groupData) {
            return new Response(JSON.stringify({ error: 'Group not found' }), {
                status: 404,
                headers: { 'Content-Type': 'application/json' },
            });
        }
        const invite = {
        email,
        status: 'pending',
        }
    
        const docRef = await addDoc(collection(db, 'invites'), invite);
        console.log('Document written with ID: ', docRef.id);

        const inviteLink = `http://localhost:3000/join-group?groupId=${groupId}`;
        return new Response(JSON.stringify({ message: inviteLink }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        });
    
    } catch (e) {
        console.error('Error adding document: ', e);
        return new Response(JSON.stringify({ error: 'Error adding document' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        });
    }

}
