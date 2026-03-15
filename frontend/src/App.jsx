import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import SplashScreen from './components/SplashScreen';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';

function App() {
  const [showSplash, setShowSplash] = useState(() => {
    if (sessionStorage.getItem('splashShown')) return false;
    sessionStorage.setItem('splashShown', '1');
    return true;
  });

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/staff-dashboard" element={<StaffDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
