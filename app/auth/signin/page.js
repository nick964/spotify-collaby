'use client';
import { signIn } from 'next-auth/react';

export default function SignIn() {
  return (
    <div>
      <h1>Sign In to Spotify</h1>
      <button onClick={() => signIn('spotify')}>Sign in with Spotify</button>
    </div>
  );
}
