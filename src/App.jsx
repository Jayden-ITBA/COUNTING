import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import SecuritySettings from './components/SecuritySettings';
import AppLock from './components/AppLock';

const ProtectedRoute = ({ children, user, profile, loading, isVerified, setIsVerified }) => {
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background-light">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <Navigate to="/login" state={{ from: window.location.pathname }} />;
  if (!profile && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" state={{ from: window.location.pathname }} />;
  }

  // PIN Lock check
  if (profile?.pin && !isVerified && window.location.pathname !== '/onboarding') {
    return <AppLock currentPin={profile.pin} onVerified={() => setIsVerified(true)} />;
  }

  return children;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f0f7ff] p-6 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-blue-400">error</span>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Úi, có lỗi nhỏ xảy ra!</h2>
          <p className="text-slate-500 mb-8 text-sm">Chúng tôi gặp một chút vấn đề khi tải trang này.</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-blue-200"
          >
            Tải lại trang
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    let unsubscribeProfile = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setLoading(true);
        unsubscribeProfile = onSnapshot(doc(db, 'profiles', currentUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            setProfile({ id: docSnap.id, ...docSnap.data() });
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Profile listener error:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
        setIsVerified(false);
        unsubscribeProfile();
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProfile();
    };
  }, []);

  const handleSetPin = async (newPin) => {
    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        pin: newPin
      });
      setIsVerified(true);
    } catch (error) {
      alert("Lỗi khi cài PIN: " + error.message);
    }
  };

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <SignUp />} />

          <Route path="/onboarding" element={<OnboardingWrapper user={user} profile={profile} loading={loading} />} />

          <Route path="/join/:inviteId" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Pairing profile={profile} onUpdate={() => {}} /></ProtectedRoute>} />

          <Route path="/" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Dashboard profile={profile} /></ProtectedRoute>} />
          <Route path="/anniversary" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Anniversary profile={profile} /></ProtectedRoute>} />
          <Route path="/diary" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Diary profile={profile} /></ProtectedRoute>} />
          <Route path="/album" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Album profile={profile} /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Settings profile={profile} /></ProtectedRoute>} />
          <Route path="/settings/background" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><BgSettings profile={profile} /></ProtectedRoute>} />
          <Route path="/settings/pairing" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Pairing profile={profile} onUpdate={() => {}} /></ProtectedRoute>} />
          <Route path="/settings/widgets" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Widgets profile={profile} /></ProtectedRoute>} />
          <Route path="/settings/profile" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><ProfileSettings profile={profile} onUpdate={() => {}} /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><NotificationSettings profile={profile} /></ProtectedRoute>} />
          <Route path="/settings/security" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><SecuritySettings profile={profile} /></ProtectedRoute>} />
          <Route path="/settings/security/lock" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><AppLock mode="set" onVerified={handleSetPin} /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute user={user} profile={profile} loading={loading} isVerified={isVerified} setIsVerified={setIsVerified}><Notifications profile={profile} /></ProtectedRoute>} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

const OnboardingWrapper = ({ user, profile, loading }) => {
  const { state, pathname } = useLocation();
  const from = state?.from || "/";

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background-light">
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!user) return <Navigate to="/login" state={{ from: pathname }} />;
  if (profile) return <Navigate to={from} replace />;

  return <ProfileOnboarding onComplete={() => {}} />;
};

export default App;

