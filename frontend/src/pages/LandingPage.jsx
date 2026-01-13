import LandingNavbar from '../components/LandingNavbar';
import logo from '../assets/Fedora_Logo.png';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-base-200">
      <LandingNavbar />
      
      <div className="hero min-h-[calc(100vh-4rem)] bg-base-200">
        <div className="hero-content text-center">
          <div className="max-w-2xl">
            <img 
              src={logo} 
              alt="Lynx's Sari-sari Store" 
              className="w-48 h-48 mx-auto mb-8 rounded-full shadow-2xl"
            />
            <h1 className="text-5xl font-bold mb-4">Lynx's Sari-sari Store</h1>
            <p className="text-2xl mb-2">Your Neighborhood Store, Now Online</p>
            <p className="text-lg mb-8 opacity-80">
              Shop your daily essentials from the comfort of your home
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button className="btn btn-primary btn-lg">Shop Now</button>
              <button className="btn btn-outline btn-lg">View Products</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
            <div className="card-body items-center text-center">
              <h3 className="card-title text-4xl mb-2">🍫</h3>
              <p className="font-semibold">Snacks</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
            <div className="card-body items-center text-center">
              <h3 className="card-title text-4xl mb-2">🥤</h3>
              <p className="font-semibold">Beverages</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
            <div className="card-body items-center text-center">
              <h3 className="card-title text-4xl mb-2">🧴</h3>
              <p className="font-semibold">Personal Care</p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer">
            <div className="card-body items-center text-center">
              <h3 className="card-title text-4xl mb-2">🏠</h3>
              <p className="font-semibold">Household</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-base-100 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Shop With Us?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🏪</div>
              <h3 className="text-xl font-bold mb-2">Trusted Store</h3>
              <p className="opacity-80">Serving the community for years</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">Affordable Prices</h3>
              <p className="opacity-80">Best prices in the neighborhood</p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">⭐</div>
              <h3 className="text-xl font-bold mb-2">Quality Products</h3>
              <p className="opacity-80">Fresh and quality guaranteed</p>
            </div>
          </div>
        </div>
      </div>

      <footer className="footer footer-center p-10 bg-base-200 text-base-content">
        <div>
          <p className="font-bold text-lg">Lynx's Sari-sari Store</p>
          <p>Your trusted neighborhood store since 2026</p>
          <p>© 2026 Lynx's Sari-sari Store. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
