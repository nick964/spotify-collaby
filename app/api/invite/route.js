import axios from 'axios';

import { db } from '../../../../lib/firebase';
import { addDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';

export async function POST(request) {

    const {searchParams} = new URL(request.url)
    const email = searchParams.get('email') || ''
    const groupId = searchParams.get('groupId') || ''
    
    if (!email || !code) {    
        return new Response(JSON.stringify({ error: 'Missing email or code' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        });
    }
    
    try {
        const invite = {
        email,
        code,
        status: 'pending',
        }
    
        const docRef = await addDoc(collection(db, 'invites'), invite);
        console.log('Document written with ID: ', docRef.id);
    
        return new Response(JSON.stringify({ message: 'Invite sent' }), {
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
