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
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);
  const orb3Ref = useRef(null);
  const actualCursorRef = useRef({ x: -999, y: -999 });
  const orbPosRef = useRef([
    { x: -999, y: -999 },
    { x: -999, y: -999 },
    { x: -999, y: -999 },
  ]);
  const hueRef = useRef(200);
  const glowRafRef = useRef(null);

  useEffect(() => {
    const onMove = (e) => { actualCursorRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', onMove);
    return () => window.removeEventListener('mousemove', onMove);
  }, []);

  useEffect(() => {
    const lerp = (a, b, t) => a + (b - a) * t;
    const speeds = [0.05, 0.09, 0.18];
    let snapped = false;

    const tick = () => {
      const target = actualCursorRef.current;
      if (target.x === -999) { glowRafRef.current = requestAnimationFrame(tick); return; }

      if (!snapped) {
        orbPosRef.current.forEach(d => { d.x = target.x; d.y = target.y; });
        snapped = true;
      }

      hueRef.current = (hueRef.current + 0.6) % 360;
      const hue = hueRef.current;

      orbPosRef.current.forEach((d, i) => {
        d.x = lerp(d.x, target.x, speeds[i]);
        d.y = lerp(d.y, target.y, speeds[i]);
      });

      const [p1, p2, p3] = orbPosRef.current;
      const h1 = hue, h2 = (hue + 50) % 360, h3 = (hue + 110) % 360;

      if (orb1Ref.current) {
        orb1Ref.current.style.left = p1.x + 'px';
        orb1Ref.current.style.top = p1.y + 'px';
        orb1Ref.current.style.background = `radial-gradient(circle, hsla(${h1},80%,65%,0.13) 0%, hsla(${h2},75%,60%,0.07) 50%, transparent 70%)`;
      }
      if (orb2Ref.current) {
        orb2Ref.current.style.left = p2.x + 'px';
        orb2Ref.current.style.top = p2.y + 'px';
        orb2Ref.current.style.background = `radial-gradient(circle, hsla(${h2},88%,68%,0.22) 0%, hsla(${h3},80%,64%,0.10) 50%, transparent 70%)`;
      }
      if (orb3Ref.current) {
        orb3Ref.current.style.left = p3.x + 'px';
        orb3Ref.current.style.top = p3.y + 'px';
        orb3Ref.current.style.background = `radial-gradient(circle, hsla(${h3},100%,78%,0.38) 0%, transparent 60%)`;
      }

      glowRafRef.current = requestAnimationFrame(tick);
    };

    glowRafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(glowRafRef.current);
  }, []);

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
      {/* Flowing cursor orbs — three layers at different lerp speeds */}
      <div ref={orb1Ref} className="pointer-events-none fixed z-[9999]" style={{ width: 440, height: 440, borderRadius: '50%', filter: 'blur(16px)', transform: 'translate(-50%, -50%)', left: -999, top: -999 }} />
      <div ref={orb2Ref} className="pointer-events-none fixed z-[9998]" style={{ width: 180, height: 180, borderRadius: '50%', filter: 'blur(7px)', transform: 'translate(-50%, -50%)', left: -999, top: -999 }} />
      <div ref={orb3Ref} className="pointer-events-none fixed z-[9997]" style={{ width: 55, height: 55, borderRadius: '50%', filter: 'blur(3px)', transform: 'translate(-50%, -50%)', left: -999, top: -999 }} />
      <div className="relative z-50">
        <LandingNavbar />

        {/* Hero */}
        <div className="hero min-h-[calc(100vh-4rem)] bg-base-200 relative overflow-hidden">
          <FloatingEmojis />
          <div className="hero-content text-center relative z-10">
            <div className="max-w-2xl">
              <img
                src={logo}
                alt="Lynx's Sari-Sari Store POS and Inventory System"
                className="w-48 h-48 mx-auto mb-8 rounded-full shadow-2xl"
              />
              <h1 className="text-5xl font-bold mb-4">Lynx's Sari-Sari Store<br /><span className="text-3xl font-semibold">POS and Inventory System</span></h1>
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
                          <span className="text-xs opacity-60">₱{p.tingiPrice.toFixed(2)}/pcs</span>
                        )}
                        <span className={`badge ${cls} badge-sm mt-1`}>{label}</span>
                        {p.stock > 0 && (
                          <div className="text-xs opacity-70 text-center leading-tight mt-1">
                            <div>{Math.floor(p.stock)} pack{Math.floor(p.stock) !== 1 ? 's' : ''}</div>
                            {p.tingiPerPack > 1 && (
                              <div>{Math.floor(p.stock * p.tingiPerPack)} pcs</div>
                            )}
                          </div>
                        )}
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
            <p className="font-bold text-lg">Lynx's Sari-Sari Store POS and Inventory System</p>
            <p>© 2026 Lynx's Sari-Sari Store. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
