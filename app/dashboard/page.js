"use client";

import { useSession } from 'next-auth/react';

export default function Dashboard() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <p>Loading...</p>;
  }

  if (!session) {
    return (
      <div>
        <h1>You are not logged in</h1>
        <a href="/api/auth/signin">Login</a>
      </div>
    );
  }

  return (
    <div>
      <h1>Welcome to your Dashboard</h1>
      <div>
        <h2>User Details</h2>
        <p><strong>Spotify ID:</strong> {session.user.id}</p>
        <p><strong>Display Name:</strong> {session.user.name}</p>
        <p><strong>Email:</strong> {session.user.email}</p>
        <img src={session.user.image} alt="Profile Picture" width="150" height="150" />
      </div>

      <div>
        <h2>Session Details</h2>
        <p><strong>Access Token:</strong> {session.accessToken}</p>
        <p><strong>Refresh Token:</strong> {session.refreshToken}</p>
      </div>
    </div>
  );
}
