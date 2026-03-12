import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../assets/Fedora_Logo.png';
import ThemeToggle from './ThemeToggle';

const LandingNavbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="navbar relative bg-base-100 shadow-lg px-4 lg:px-8">
      <div className="flex-1">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Lynx's Sari-Sari Store POS and Sales System" className="h-12 w-12 rounded-full" />
          <span className="font-bold leading-tight"><span className="text-xl">Lynx's Sari-Sari Store</span><br /><span className="text-sm font-medium opacity-70">POS and Sales System</span></span>
        </Link>
      </div>

      <div className="flex-none gap-2">
        {/* Mobile menu button */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          className="btn btn-ghost lg:hidden"
        >
          {open ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop actions */}
        <div className="hidden lg:flex items-center gap-2">
          <ThemeToggle />
          <Link to="/login">
            <button className="btn btn-ghost">Login</button>
          </Link>
          <Link to="/register">
            <button className="btn btn-primary">Create Account</button>
          </Link>
        </div>
      </div>

      {/* Mobile dropdown menu - simplified: toggle, login, create account centered on one row */}
      {open && (
        <div className="absolute top-full inset-x-2 sm:inset-x-4 mt-2 bg-base-100 shadow-lg rounded-lg py-3 px-4 flex flex-col items-start gap-3 lg:hidden z-50">
          <div className="w-full flex items-center justify-end gap-2">
            <ThemeToggle />
            <span className="text-sm font-medium">Toggle Theme</span>
          </div>

          <Link to="/login" onClick={() => setOpen(false)} className="w-full">
            <button className="btn btn-ghost w-full justify-end">Login</button>
          </Link>

          <Link to="/register" onClick={() => setOpen(false)} className="w-full">
            <button className="btn btn-primary w-full justify-end">Create Account</button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default LandingNavbar;
