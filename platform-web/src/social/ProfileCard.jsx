import React from 'react';

export function ProfileCard({ profile, onFollow }) {
  return (
    <section style={{ border: '1px solid #2a2a2a', borderRadius: 12, padding: 16 }}>
      <h3>{profile?.displayName || 'User'}</h3>
      <p>{profile?.bio || 'No bio yet'}</p>
      <button type="button" onClick={onFollow}>Follow</button>
    </section>
  );
}
