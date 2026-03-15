import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/Fedora_Logo.png';
import ThemeToggle from '../components/ThemeToggle';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const cooldownRef = useRef(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown > 0]);

  const { email, password } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (cooldown > 0) return;

    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Store user data and token
        localStorage.setItem('user', JSON.stringify(data));
        
        // Redirect based on role
        if (data.role === 'admin') {
          navigate('/admin-dashboard');
        } else if (data.role === 'staff') {
          navigate('/staff-dashboard');
        } else {
          navigate('/customer-dashboard');
        }
      } else {
        const newCount = failCount + 1;
        setFailCount(newCount);
        if (newCount >= 3) {
          setFailCount(0);
          setCooldown(5);
          setError('Too many failed attempts. Please wait 5 seconds.');
        } else {
          setError(data.message || 'Login failed');
        }
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center px-4">
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex flex-col items-center mb-6">
            <img src={logo} alt="Logo" className="w-20 h-20 rounded-full mb-3" />
            <p className="text-lg font-bold text-center leading-tight">
              Lynx's Sari-Sari Store<br />
              <span className="text-sm font-semibold opacity-70">POS and Sales System</span>
            </p>
            <div className="divider my-2"></div>
            <h2 className="card-title text-2xl">Welcome Back</h2>
            <p className="text-sm opacity-70">Login to your account</p>
          </div>

          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="your@email.com"
                className="input input-bordered"
                required
              />
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="input input-bordered"
                required
              />
              <label className="label">
                <a href="#" className="label-text-alt link link-hover">
                  Forgot password?
                </a>
              </label>
            </div>

            <div className="form-control mt-6">
              <button
                type="submit"
                className={`btn btn-primary ${loading ? 'loading' : ''}`}
                disabled={loading || cooldown > 0}
              >
                {cooldown > 0 ? `Wait ${cooldown}s...` : loading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>

          <div className="divider">OR</div>

          <div className="text-center">
            <p>
              Don't have an account?{' '}
              <a href="/register" className="link link-primary">
                Create one here
              </a>
            </p>
          </div>

          <div className="text-center mt-4">
            <a href="/" className="link link-neutral text-sm">
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
