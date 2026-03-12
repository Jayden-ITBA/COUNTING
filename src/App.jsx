import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { auth, db } from './services/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useData } from './context/DataContext';
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

const ProtectedRoute = ({ children, isVerified, setIsVerified }) => {
  const { user, profile, loading } = useData();
  const [showSpinner, setShowSpinner] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSpinner(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading && showSpinner) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8faff] p-6">
      <div className="w-16 h-16 bg-white rounded-3xl shadow-xl shadow-blue-100/50 flex items-center justify-center border border-blue-50">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="mt-8 text-[10px] text-slate-300 font-black uppercase tracking-[0.4em]">Đang tải yêu thương...</p>
    </div>
  );
  
  if (!user) return <Navigate to="/login" state={{ from: window.location.pathname }} />;
  if (!profile && !loading && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" state={{ from: window.location.pathname }} />;
  }

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

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8faff] p-10 text-center font-sans">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 shadow-xl shadow-blue-100/50 border border-blue-50 text-blue-500">
            <iconify-icon icon="solar:danger-triangle-bold-duotone" width="48" height="48"></iconify-icon>
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">Úi, có lỗi nhỏ rồi!</h2>
          <p className="text-slate-400 font-bold mb-10 uppercase tracking-widest text-[11px]">Đừng lo, chúng mình sẽ khắc phục ngay</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-primary text-white px-10 py-5 rounded-full font-black shadow-lg shadow-blue-200 active:scale-95 transition-all text-xs uppercase tracking-widest"
          >
            Tải lại trang xem sao
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

function App() {
  const { user, profile, loading } = useData();
  const [isVerified, setIsVerified] = useState(false);

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

          <Route path="/onboarding" element={<OnboardingWrapper />} />

          <Route path="/join/:inviteId" element={<ProtectedRoute isVerified={isVerified} setIsVerified={setIsVerified}><Pairing /></ProtectedRoute>} />

          <Route path="/" element={<ProtectedRoute isVerified={isVerified} setIsVerified={setIsVerified}><Dashboard /></ProtectedRoute>} />
          <Route path="/anniversary" element={<ProtectedRoute isVerified={isVerified} setIsVerified={setIsVerified}><Anniversary /></ProtectedRoute>} />
          <Route path="/diary" element={<ProtectedRoute isVerified={isVerified} setIsVerified={setIsVerified}><Diary /></ProtectedRoute>} />
          <Route path="/album" element={<ProtectedRoute isVerified={isVerified} setIsVerified={setIsVerified}><Album /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute isVerified={isVerified} setIsVerified={setIsVerified}><Settings /></ProtectedRoute>} />
          <Route path="/settings/background" element={<ProtectedRoute isVerified={isVerified} setIsVerified={setIsVerified}><BgSettings /></ProtectedRoute>} />
          <Route path="/settings/pairing" element={<ProtectedRoute isVerified={isVerified} setIsVerified={setIsVerified}><Pairing /></ProtectedRoute>} />
          <Route path="/settings/widgets" element={<ProtectedRoute isVerified={isVerified} setIsVerified={setIsVerified}><Widgets /></ProtectedRoute>} />
          <Route path="/settings/profile" element={<ProtectedRoute isVerified={isVerified} setIsVerified={setIsVerified}><ProfileSettings /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute isVerified={isVerified} setIsVerified={setIsVerified}><NotificationSettings /></ProtectedRoute>} />
          <Route path="/settings/security" element={<ProtectedRoute isVerified={isVerified} setIsVerified={setIsVerified}><SecuritySettings /></ProtectedRoute>} />
          <Route path="/settings/security/lock" element={<ProtectedRoute isVerified={isVerified} setIsVerified={setIsVerified}><AppLock mode="set" onVerified={handleSetPin} /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute isVerified={isVerified} setIsVerified={setIsVerified}><Notifications /></ProtectedRoute>} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}

const OnboardingWrapper = () => {
  const { user, profile, loading } = useData();
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

