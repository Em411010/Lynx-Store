import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
    } else {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'staff') {
        navigate('/');
      }
      setUser(parsedUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <a className="btn btn-ghost text-xl">Staff Dashboard</a>
        </div>
        <div className="flex-none gap-2">
          <span className="mr-4">Welcome, {user.firstName}!</span>
          <button onClick={handleLogout} className="btn btn-ghost">
            Logout
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Today's Orders</div>
              <div className="stat-value">0</div>
              <div className="stat-desc">Staff Dashboard</div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title">Staff Panel</h2>
              <p>Staff dashboard content coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffDashboard;