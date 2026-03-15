import { useState, useEffect, useRef } from 'react';
import LandingNavbar from '../components/LandingNavbar';
import FloatingEmojis from '../components/FloatingEmojis';
import logo from '../assets/Fedora_Logo.png';

const LandingPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const productsRef = useRef(null);

  useEffect(() => {
    fetch('/api/products/public')
      .then(r => r.json())
      .then(data => {
        setProducts(data);
        const seen = new Set();
        const cats = [];
        data.forEach(p => {
          if (p.category && !seen.has(p.category._id)) {
            seen.add(p.category._id);
            cats.push(p.category);
          }
        });
        setCategories(cats);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()));
    const matchCat = !activeCategory || p.category?._id === activeCategory;
    return matchSearch && matchCat;
  });

  const getStockBadge = (p) => {
    if (p.stock <= 0) return { label: 'Out of Stock', cls: 'badge-error' };
    if (p.stock <= p.reorderLevel) return { label: 'Low Stock', cls: 'badge-warning' };
    return { label: 'Available', cls: 'badge-success' };
  };

  return (
    <div className="min-h-screen bg-base-200">
      <div className="relative z-50">
        <LandingNavbar />

        {/* Hero */}
        <div className="hero min-h-[calc(100vh-4rem)] bg-base-200 relative overflow-hidden">
          <FloatingEmojis />
          <div className="hero-content text-center relative z-10">
            <div className="max-w-2xl">
              <img
                src={logo}
                alt="Lynx's Sari-Sari Store POS and Sales System"
                className="w-48 h-48 mx-auto mb-8 rounded-full shadow-2xl"
              />
              <h1 className="text-5xl font-bold mb-4">Lynx's Sari-Sari Store<br /><span className="text-3xl font-semibold">POS and Sales System</span></h1>
              <p className="text-2xl mb-2">Fast. Simple. Reliable.</p>
              <p className="text-lg mb-8 opacity-80">
                Manage sales, inventory, and reports — all in one place
              </p>
              <button
                onClick={() => productsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="btn btn-primary btn-lg">
                Browse Products
              </button>
            </div>
          </div>
        </div>

        {/* Products Section */}
        <div ref={productsRef} className="container mx-auto px-4 py-16">
          <h2 className="text-3xl font-bold text-center mb-2">Available Products</h2>
          <p className="text-center opacity-60 mb-8">Browse our products and check availability</p>

          {/* Search */}
          <div className="flex justify-center mb-5">
            <input
              type="text"
              placeholder="🔍 Search products or brand..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input input-bordered w-full max-w-md"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 justify-center mb-8">
            <button
              onClick={() => setActiveCategory('')}
              className={`btn btn-sm ${!activeCategory ? 'btn-primary' : 'btn-ghost'}`}>
              All
            </button>
            {categories.map(c => (
              <button
                key={c._id}
                onClick={() => setActiveCategory(c._id)}
                className={`btn btn-sm ${activeCategory === c._id ? 'btn-primary' : 'btn-ghost'}`}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filtered.map(p => {
                const { label, cls } = getStockBadge(p);
                return (
                  <div key={p._id} className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
                    <div className="card-body p-4 items-center text-center">
                      <div className="text-4xl mb-2">{p.category?.icon || '📦'}</div>
                      <h3 className="font-semibold text-sm leading-tight">{p.name}</h3>
                      {p.brand && <p className="text-xs opacity-50">{p.brand}</p>}
                      <div className="flex flex-col items-center gap-1 mt-2">
                        <span className="text-primary font-bold">₱{p.unitPrice.toFixed(2)}</span>
                        {p.tingiPrice > 0 && (
                          <span className="text-xs opacity-60">₱{p.tingiPrice.toFixed(2)}/{p.tingiUnit}</span>
                        )}
                        <span className={`badge ${cls} badge-sm mt-1`}>{label}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full text-center py-16 opacity-50">No products found.</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="footer footer-center p-10 bg-base-100 text-base-content">
          <div>
            <p className="font-bold text-lg">Lynx's Sari-Sari Store POS and Sales System</p>
            <p>© 2026 Lynx's Sari-Sari Store. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
