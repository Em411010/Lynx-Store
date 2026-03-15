import { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/Fedora_Logo.png';
import ThemeToggle from '../components/ThemeToggle';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const { firstName, lastName, email, password, confirmPassword } = formData;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, password })
      });
      const data = await response.json();
      if (response.ok) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Registration failed');
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
            <h2 className="card-title text-2xl">Staff Registration</h2>
            <p className="text-sm opacity-70 text-center">Create a staff account — pending admin approval</p>
          </div>

          {submitted ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">⏳</div>
              <h3 className="text-xl font-bold mb-2">Account Submitted!</h3>
              <p className="opacity-70 mb-6">Your account is pending approval by the administrator. You will be able to log in once it has been approved.</p>
              <Link to="/login" className="btn btn-primary w-full">Go to Login</Link>
              <Link to="/" className="btn btn-ghost w-full mt-2">Back to Home</Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="alert alert-error mb-4">
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-3">
                  <div className="form-control">
                    <label className="label"><span className="label-text">First Name</span></label>
                    <input type="text" name="firstName" value={firstName} onChange={handleChange}
                      placeholder="Juan" className="input input-bordered" required />
                  </div>
                  <div className="form-control">
                    <label className="label"><span className="label-text">Last Name</span></label>
                    <input type="text" name="lastName" value={lastName} onChange={handleChange}
                      placeholder="Dela Cruz" className="input input-bordered" required />
                  </div>
                </div>

                <div className="form-control mt-4">
                  <label className="label"><span className="label-text">Email</span></label>
                  <input type="email" name="email" value={email} onChange={handleChange}
                    placeholder="juan@example.com" className="input input-bordered" required />
                </div>

                <div className="form-control mt-4">
                  <label className="label"><span className="label-text">Password</span></label>
                  <input type="password" name="password" value={password} onChange={handleChange}
                    placeholder="At least 6 characters" className="input input-bordered" required />
                </div>

                <div className="form-control mt-4">
                  <label className="label"><span className="label-text">Confirm Password</span></label>
                  <input type="password" name="confirmPassword" value={confirmPassword} onChange={handleChange}
                    placeholder="Re-enter password" className="input input-bordered" required />
                </div>

                <div className="form-control mt-6">
                  <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit for Approval'}
                  </button>
                </div>
              </form>

              <div className="divider">OR</div>
              <div className="text-center">
                <p>Already have an account? <Link to="/login" className="link link-primary">Login here</Link></p>
              </div>
              <div className="text-center mt-2">
                <Link to="/" className="link link-neutral text-sm">Back to Home</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
