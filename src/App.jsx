import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Anniversary from './components/Anniversary';
import Diary from './components/Diary';
import Album from './components/Album';
import Settings from './components/Settings';
import Pairing from './components/Pairing';
import BgSettings from './components/BgSettings';
import Widgets from './components/Widgets';
import ProfileOnboarding from './components/ProfileOnboarding';

const ProtectedRoute = ({ children, user, profile, loading }) => {
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background-light">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (!profile && window.location.pathname !== '/onboarding') return <Navigate to="/onboarding" />;
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (uid) => {
    try {
      const docSnap = await getDoc(doc(db, 'profiles', uid));
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchProfile(currentUser.uid);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleProfileComplete = () => {
    if (user) fetchProfile(user.uid);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />

        <Route path="/onboarding" element={
          user ? (profile ? <Navigate to="/" /> : <ProfileOnboarding onComplete={handleProfileComplete} />) : <Navigate to="/login" />
        } />

        <Route path="/join/:inviteId" element={<ProtectedRoute user={user} profile={profile} loading={loading}><Pairing profile={profile} onUpdate={handleProfileComplete} /></ProtectedRoute>} />

        <Route path="/" element={<ProtectedRoute user={user} profile={profile} loading={loading}><Dashboard profile={profile} /></ProtectedRoute>} />
        <Route path="/anniversary" element={<ProtectedRoute user={user} profile={profile} loading={loading}><Anniversary profile={profile} /></ProtectedRoute>} />
        <Route path="/diary" element={<ProtectedRoute user={user} profile={profile} loading={loading}><Diary profile={profile} /></ProtectedRoute>} />
        <Route path="/album" element={<ProtectedRoute user={user} profile={profile} loading={loading}><Album profile={profile} /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute user={user} profile={profile} loading={loading}><Settings profile={profile} /></ProtectedRoute>} />
        <Route path="/settings/background" element={<ProtectedRoute user={user} profile={profile} loading={loading}><BgSettings profile={profile} /></ProtectedRoute>} />
        <Route path="/settings/pairing" element={<ProtectedRoute user={user} profile={profile} loading={loading}><Pairing profile={profile} onUpdate={handleProfileComplete} /></ProtectedRoute>} />
        <Route path="/settings/widgets" element={<ProtectedRoute user={user} profile={profile} loading={loading}><Widgets profile={profile} /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
