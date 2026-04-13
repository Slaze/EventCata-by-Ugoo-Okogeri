import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ProfileCard } from './social/ProfileCard';
import { FeedList } from './social/FeedList';

function Home() {
  const demoProfile = { displayName: 'Ugoo', bio: 'Event host and community builder' };
  const demoFeed = [
    { id: '1', type: 'event_created', eventId: 'demo-event-1' },
    { id: '2', type: 'post_created', eventId: 'demo-event-1' }
  ];
  return (
    <main style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}>
      <h1>EventCata Platform (Refactor Scaffold)</h1>
      <p>This preserves route shape for migration.</p>
      <nav style={{ display: 'flex', gap: 12 }}>
        <Link to="/">Home</Link>
        <Link to="/detail">Detail</Link>
        <Link to="/create">Create</Link>
      </nav>
      <div style={{ marginTop: 20, display: 'grid', gap: 16 }}>
        <ProfileCard profile={demoProfile} onFollow={() => {}} />
        <FeedList items={demoFeed} />
      </div>
    </main>
  );
}

function Detail() {
  return <main style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}><h2>Detail Route</h2></main>;
}

function Create() {
  return <main style={{ padding: 24, fontFamily: 'Inter, sans-serif' }}><h2>Create Route</h2></main>;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/detail" element={<Detail />} />
        <Route path="/create" element={<Create />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
