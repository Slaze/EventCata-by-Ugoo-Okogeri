import React from 'react';

export function FeedList({ items }) {
  if (!items?.length) return <p>No feed activity yet.</p>;
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      {items.map((item) => (
        <li key={item.id} style={{ borderBottom: '1px solid #2a2a2a', padding: '10px 0' }}>
          <strong>{item.type}</strong> · {item.eventId || 'event'}
        </li>
      ))}
    </ul>
  );
}
