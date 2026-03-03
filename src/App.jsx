import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { auth, db } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import Anniversary from './components/Anniversary';
import Diary from './components/Diary';
import Album from './components/Album';
import Settings from './components/Settings';
import Pairing from './components/Pairing';
import BgSettings from './components/BgSettings';
import Widgets from './components/Widgets';
import ProfileOnboarding from './components/ProfileOnboarding';
import Notifications from './components/Notifications';
import ProfileSettings from './components/ProfileSettings';
import NotificationSettings from './components/NotificationSettings';
import AppLock from './components/AppLock';

const ProtectedRoute = ({ children, user, profile, loading, isVerified, setIsVerified }) => {
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background-light">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (!profile && window.location.pathname !== '/onboarding') return <Navigate to="/onboarding" />;

  // PIN Lock check
  if (profile?.pin && !isVerified && window.location.pathname !== '/onboarding') {
    return <AppLock currentPin={profile.pin} onVerified={() => setIsVerified(true)} />;
  }

  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

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
        setIsVerified(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleProfileComplete = () => {
    if (user) fetchProfile(user.uid);
  };

  const handleSetPin = async (newPin) => {
    try {
      await updateDoc(doc(db, 'profiles', user.uid), { pin: newPin });
      handleProfileComplete();
      setIsVerified(true);
    } catch (error) {
      alert("Lỗi khi cài PIN: " + error.message);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />

        <Route path="/onboarding" element={
          user ? (profile ? <Navigate to="/" /> : <ProfileOnboarding onComplete={handleProfileComplete} />) : <Navigate to="/login" />
        } />

        <Route path="/join/:inviteId" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Pairing profile={profile} onUpdate={handleProfileComplete} /></ProtectedRoute>} />

        <Route path="/" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Dashboard profile={profile} /></ProtectedRoute>} />
        <Route path="/anniversary" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Anniversary profile={profile} /></ProtectedRoute>} />
        <Route path="/diary" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Diary profile={profile} /></ProtectedRoute>} />
        <Route path="/album" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Album profile={profile} /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Settings profile={profile} /></ProtectedRoute>} />
        <Route path="/settings/background" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><BgSettings profile={profile} /></ProtectedRoute>} />
        <Route path="/settings/pairing" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Pairing profile={profile} onUpdate={handleProfileComplete} /></ProtectedRoute>} />
        <Route path="/settings/widgets" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Widgets profile={profile} /></ProtectedRoute>} />
        <Route path="/settings/profile" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><ProfileSettings profile={profile} onUpdate={handleProfileComplete} /></ProtectedRoute>} />
        <Route path="/settings/notifications" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><NotificationSettings profile={profile} /></ProtectedRoute>} />
        <Route path="/settings/security" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}>
          <AppLock mode="set" onVerified={handleSetPin} />
        </ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Notifications profile={profile} /></ProtectedRoute>} />
      </Routes>
    </Router>
  );
}

export default App;

