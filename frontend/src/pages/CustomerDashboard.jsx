import logo from '../assets/Fedora_Logo.png';

const CustomerDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <img src={logo} alt="Logo" className="h-10 w-10 rounded-full mr-3" />
          <span className="text-xl font-bold">Lynx's Sari-sari Store</span>
        </div>
        <div className="flex-none">
          <button className="btn btn-ghost" onClick={() => {
            localStorage.removeItem('user');
            window.location.href = '/';
          }}>
            Logout
          </button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Total Products</div>
              <div className="stat-value">0</div>
              <div className="stat-desc">Available in store</div>
            </div>
          </div>
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Total Orders</div>
              <div className="stat-value">0</div>
              <div className="stat-desc">All time orders</div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h3 className="card-title">Quick Actions</h3>
              <p>Customer dashboard content coming soon...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
