import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../assets/Fedora_Logo.png';
import ThemeToggle from './ThemeToggle';

const LandingNavbar = () => {
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="navbar relative bg-base-100 shadow-lg px-4 lg:px-8">
      <div className="flex-1">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Lynx's Sari-Sari Store POS and Inventory System" className="h-12 w-12 rounded-full" />
          <span className="font-bold leading-tight"><span className="text-xl">Lynx's Sari-Sari Store</span><br /><span className="text-sm font-medium opacity-70">POS and Inventory System</span></span>
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
        <div className="hidden lg:flex items-center gap-3">
          <div className="text-right tabular-nums leading-tight">
            <div className="text-xs opacity-60">{now.toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div className="text-sm font-mono font-bold">{now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
          </div>
          <ThemeToggle />
          <Link to="/register">
            <button className="btn btn-ghost btn-sm">Staff Register</button>
          </Link>
          <Link to="/login">
            <button className="btn btn-primary">Login</button>
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

          <Link to="/register" onClick={() => setOpen(false)} className="w-full">
            <button className="btn btn-ghost w-full justify-end">Staff Register</button>
          </Link>
          <Link to="/login" onClick={() => setOpen(false)} className="w-full">
            <button className="btn btn-primary w-full justify-end">Login</button>
          </Link>
        </div>
      )}
    </div>
  );
};

export default LandingNavbar;
