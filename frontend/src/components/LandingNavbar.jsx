import { Link } from 'react-router-dom';
import logo from '../assets/Fedora_Logo.png';

const LandingNavbar = () => {
  return (
    <div className="navbar bg-base-100 shadow-lg px-4 lg:px-8">
      <div className="flex-1">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Lynx's Sari-sari Store" className="h-12 w-12 rounded-full" />
          <span className="text-xl font-bold">Lynx's Sari-sari Store</span>
        </Link>
      </div>
      <div className="flex-none gap-2">
        <Link to="/login">
          <button className="btn btn-ghost">Login</button>
        </Link>
        <Link to="/register">
          <button className="btn btn-primary">Create Account</button>
        </Link>
      </div>
    </div>
  );
};

export default LandingNavbar;
