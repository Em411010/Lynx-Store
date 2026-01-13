import { useState, useEffect } from 'react';
import logo from '../assets/Fedora2_Logo.jpg';

const SplashScreen = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="text-center max-w-2xl px-8">
        <img 
          src={logo} 
          alt="Fedora Logo" 
          className="w-48 h-48 mx-auto mb-8 rounded-full shadow-2xl animate-pulse"
        />
        
        <h1 className="text-5xl font-bold mb-4">FEDORA</h1>
        <p className="text-xl mb-8 italic">Engineers in Training. Innovators in Action.</p>
        
        <div className="divider"></div>
        
        <h2 className="text-2xl font-bold mb-2">SOFTWARE DESIGN</h2>
        <p className="text-xl mb-8">CPE211</p>
        
        <div className="text-left bg-base-100 p-6 rounded-lg shadow-xl">
          <h3 className="text-lg font-bold mb-4">Members:</h3>
          <ul className="space-y-2">
            <li>Mendoza, Jhon Axel O.</li>
            <li>Puzo, Reyzen C.</li>
            <li>Esona, Madel P.</li>
            <li>Lancero, Maica Pearl F.</li>
            <li>Africano, Michael P.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
