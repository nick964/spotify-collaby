'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

const AuthCodeComponent = () => {
  const [tokenData, setTokenData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [attemptCount, setAttemptCount] = useState(0);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  
  // Ref to track if the fetch has already been initiated
  const hasFetchedRef = useRef(false);

  // Log component mount
  useEffect(() => {
    console.log('Component mounted');
  }, []);

  useEffect(() => {
    if (code && !hasFetchedRef.current) {
      console.log('logging out code in client component', code);
      hasFetchedRef.current = true;

      const fetchAccessToken = async () => {
        try {
          setAttemptCount((prev) => prev + 1);
          const response = await fetch('/api/auth/spotify?code=' + code);
          const data = await response.json();
          console.log('logging resopnse in client', data);
          if (response.ok) {
            setTokenData(data);
          } else {
            setError(data.error);
          }
        } catch (err) {
          setError('Failed to fetch token');
        } finally {
          setIsLoading(false);
        }
      };

      fetchAccessToken();
    }
  }, [code]);

  return (
      <div>
        <h1>Spotify Callback</h1>
        <h2>Attempt Count: {attemptCount}</h2>
        {error && (
          <div>
            <p>Error: {error}</p>
          </div>
        )}

        {isLoading && (
          <p>Loading...</p>
        )}

        {tokenData && (
          <div>
            <h2>Access Token Data</h2>
            <pre>{JSON.stringify(tokenData, null, 2)}</pre>
          </div>
        )}
      </div>
  );
};

export default AuthCodeComponent;
