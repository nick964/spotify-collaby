'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '../../lib/firebase';
import { addDoc, getDocs, collection, query, where, updateDoc, getDoc, doc } from 'firebase/firestore';
import { signIn } from 'next-auth/react';
import { Button } from '../ui/button';

export function JoinGroupCode() {

  const [isLoading, setIsLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const groupId = searchParams.get('groupId');
  
  // Ref to track if the fetch has already been initiated
  const hasFetchedRef = useRef(false);


  useEffect(() => {
    if (groupId) {
      console.log('logging out group id in client component', groupId);
      const fetchGroup = async () => {
        try {
          const docRef = doc(db, 'groups', groupId);
          // Fetch the document
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            console.log('Document data:', docSnap.data());
            localStorage.setItem('groupId', groupId);
            setGroup(docSnap.data());
          } else {
            // doc.data() will be undefined in this case
            console.log('No such document!');
          }
        } catch (err) {
          console.log('Error getting document:', err);
          setError('Failed to fetch token');
        } finally {
          setIsLoading(false);
        }
      };

      fetchGroup();
    }
  }, [groupId]);

  return (
      <div>
        <h1>Join Group</h1>
        {isLoading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        {group && (
          <div>
            <h2>{group.name}</h2>
            <p>{group.description}</p>
            <Button onClick={() => signIn('spotify')}>Join Group</Button>
          </div>
        )}
      </div>
  );
};
