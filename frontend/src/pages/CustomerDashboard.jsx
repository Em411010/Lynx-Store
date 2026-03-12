import { useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { Menu, X } from 'lucide-react';
import { api, formatPeso, formatDate, formatDateTime } from '../utils/api';
import ThemeToggle from '../components/ThemeToggle';

const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Overview State
  const [myTransactions, setMyTransactions] = useState([]);

  // Feedback & Support State
  const [myFeedback, setMyFeedback] = useState([]);
  const [myTickets, setMyTickets] = useState([]);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState('medium');
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [showTicketForm, setShowTicketForm] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) { navigate('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'customer') { navigate('/'); return; }
    setUser(parsed);
  }, [navigate]);

  const loadTransactions = useCallback(async () => {
    try { setMyTransactions(await api.get('/transactions/my')); } catch (e) { console.error(e); }
  }, []);

  const loadFeedback = useCallback(async () => {
    try { setMyFeedback(await api.get('/feedback/my')); } catch (e) { console.error(e); }
  }, []);

  const loadTickets = useCallback(async () => {
    try { setMyTickets(await api.get('/tickets/my')); } catch (e) { console.error(e); }
  }, []);

  const submitFeedback = async () => {
    if (!feedbackRating || !feedbackComment.trim()) {
      alert('Please provide both rating and comment');
      return;
    }
    try {
      await api.post('/feedback', { rating: feedbackRating, comment: feedbackComment });
      alert('Thank you for your feedback!');
      setFeedbackRating(0);
      setFeedbackComment('');
      setShowFeedbackForm(false);
      loadFeedback();
    } catch (e) {
      alert('Failed to submit feedback');
      console.error(e);
    }
  };

  const submitTicket = async () => {
    if (!ticketSubject.trim() || !ticketDescription.trim()) {
      alert('Please fill in all fields');
      return;
    }
    try {
      await api.post('/tickets', {
        subject: ticketSubject,
        description: ticketDescription,
        priority: ticketPriority
      });
      alert('Ticket submitted successfully!');
      setTicketSubject('');
      setTicketDescription('');
      setTicketPriority('medium');
      setShowTicketForm(false);
      loadTickets();
    } catch (e) {
      alert('Failed to submit ticket');
      console.error(e);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadTransactions();
    loadFeedback();
    loadTickets();
  }, [user, loadTransactions, loadFeedback, loadTickets]);

  const handleLogout = () => { localStorage.removeItem('user'); navigate('/'); };

  if (!user) return null;

  const tabs = [
    { key: 'overview', label: '🏠 Overview' },
    { key: 'history', label: '📜 History' },
    { key: 'support', label: '💬 Feedback' },
  ];

  return (
    <div className="min-h-screen bg-base-200 flex relative">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 md:hidden z-30" onClick={() => setSidebarOpen(false)}></div>}
      
      {/* Sidebar */}
      <div className={`${ sidebarOpen ? 'fixed' : 'hidden' } md:static md:block w-52 bg-base-100 shadow-xl flex flex-col min-h-screen md:min-h-screen z-40 transition-all`}>
        <div className="p-4 border-b border-base-300 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-xs md:text-lg">🏪 Lynx Store</h2>
            <p className="text-[10px] md:text-xs opacity-60">Customer</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden btn btn-ghost btn-sm">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 p-1 md:p-2">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`w-full text-left px-2 md:px-3 py-2 md:py-2.5 rounded-lg mb-1 text-[10px] md:text-sm transition-all ${activeTab === tab.key ? 'bg-primary text-primary-content font-semibold' : 'hover:bg-base-200'}`}>
              <span className="md:inline">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-2 md:p-4 border-t border-base-300 overflow-hidden">
          <p className="text-[10px] md:text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
          <p className="text-[9px] md:text-xs opacity-60 mb-2">Customer</p>
          <div className="flex flex-col md:flex-row gap-1 mb-1">
            <button onClick={handleLogout} className="btn btn-[10px] md:btn-sm btn-ghost flex-1 py-1 h-auto min-h-0">Logout</button>
            <ThemeToggle className="scale-75 md:scale-100" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto max-h-screen p-6 relative">
        {/* Mobile sidebar toggle button */}
        <button onClick={() => setSidebarOpen(true)} className="md:hidden btn btn-ghost btn-sm mb-4" aria-label="Open sidebar">
          <Menu size={24} />
        </button>

        {activeTab === 'overview' && (
          <div>
            <h2 className="text-lg md:text-2xl font-bold mb-6">Welcome, {user.firstName}!</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <div className="stat bg-base-100 rounded-xl shadow p-2 md:p-4">
                <div className="stat-title text-[10px] md:text-sm">Purchases</div>
                <div className="stat-value text-primary text-lg md:text-2xl">{myTransactions.length}</div>
                <div className="stat-desc text-[9px] md:text-xs">Total transactions</div>
              </div>
              <div className="stat bg-base-100 rounded-xl shadow p-2 md:p-4">
                <div className="stat-title text-[10px] md:text-sm">Total Spent</div>
                <div className="stat-value text-success text-lg md:text-2xl">{formatPeso(myTransactions.reduce((s, t) => s + t.totalAmount, 0))}</div>
                <div className="stat-desc text-[9px] md:text-xs">All time</div>
              </div>
            </div>

            <div className="bg-base-100 rounded-xl shadow p-3 md:p-4">
              <h3 className="font-bold text-sm md:text-lg mb-3">Recent Purchases</h3>
                {myTransactions.length === 0 ? (
                <div className="text-center py-6 opacity-60">
                  <p className="mt-2 text-xs md:text-base">No purchases yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {myTransactions.slice(0, 5).map(t => (
                    <div key={t._id} className="flex justify-between items-center bg-base-200 p-2 md:p-3 rounded-lg">
                      <div className="max-w-[70%]">
                        <div className="text-[10px] md:text-sm truncate">{t.items.map(i => `${i.productName} x${i.quantity}`).join(', ')}</div>
                        <div className="text-[9px] md:text-xs opacity-60">{formatDateTime(t.createdAt)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-[11px] md:text-base">{formatPeso(t.totalAmount)}</div>
                        <span className="badge badge-[9px] md:badge-xs badge-success">Cash</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            <h2 className="text-xl font-bold mb-4">📜 Purchase History</h2>

            {myTransactions.length === 0 ? (
              <div className="text-center py-12 opacity-60">
                <span className="text-5xl">🛒</span>
                <p className="mt-3">No purchases yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myTransactions.map(t => (
                  <div key={t._id} className="bg-base-100 rounded-xl shadow p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-mono text-xs opacity-60">{t.receiptNumber}</div>
                        <div className="text-xs">{formatDateTime(t.createdAt)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatPeso(t.totalAmount)}</div>
                        <span className="badge badge-sm badge-success">💵 Cash</span>
                      </div>
                    </div>
                    <div className="border-t border-base-200 pt-2">
                      {t.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>
                            {item.productName}
                            {item.isTingi && <span className="badge badge-xs badge-secondary ml-1">Tingi</span>}
                            <span className="opacity-60"> x{item.quantity}</span>
                          </span>
                          <span>{formatPeso(item.subtotal)}</span>
                        </div>
                      ))}
                    </div>
                    {t.paymentMethod === 'cash' && t.cashReceived > 0 && (
                      <div className="text-xs text-right mt-2 opacity-60">
                        Cash: {formatPeso(t.cashReceived)} | Change: {formatPeso(t.changeAmount)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'support' && (
          <div>
            <h2 className="text-2xl font-bold mb-6">💬 Feedback & Support</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-base-100 rounded-xl shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">⭐ Give Feedback</h3>
                  <button onClick={() => setShowFeedbackForm(!showFeedbackForm)} className="btn btn-sm btn-primary">
                    {showFeedbackForm ? 'Cancel' : '+ New Feedback'}
                  </button>
                </div>

                {showFeedbackForm && (
                  <div className="bg-base-200 rounded-lg p-4 mb-4">
                    <div className="mb-3">
                      <label className="label">
                        <span className="label-text font-semibold">Rating</span>
                      </label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button key={star} onClick={() => setFeedbackRating(star)}
                            className={`text-3xl transition-all ${feedbackRating >= star ? 'text-warning' : 'text-base-300 hover:text-warning'}`}>
                            ⭐
                          </button>
                        ))}
                      </div>
                      {feedbackRating > 0 && <p className="text-xs mt-1 opacity-60">{feedbackRating} out of 5 stars</p>}
                    </div>

                    <div className="mb-3">
                      <label className="label">
                        <span className="label-text font-semibold">Comment</span>
                      </label>
                      <textarea value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)}
                        className="textarea textarea-bordered w-full" rows="4"
                        placeholder="Share your experience with us..."></textarea>
                    </div>

                    <button onClick={submitFeedback} className="btn btn-primary btn-sm w-full">Submit Feedback</button>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold mb-2">My Feedback History</p>
                  {myFeedback.length === 0 ? (
                    <div className="text-center py-6 opacity-60">
                      <span className="text-3xl">📝</span>
                      <p className="mt-2 text-sm">No feedback submitted yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {myFeedback.map(f => (
                        <div key={f._id} className="bg-base-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-1">
                            <div className="flex gap-1">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-sm ${i < f.rating ? 'text-warning' : 'text-base-300'}`}>⭐</span>
                              ))}
                            </div>
                            <span className="text-xs opacity-60">{formatDate(f.createdAt)}</span>
                          </div>
                          <p className="text-sm">{f.comment}</p>
                          {f.isRead && <span className="badge badge-xs badge-success mt-2">✓ Read by admin</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-base-100 rounded-xl shadow p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">🎫 Support Tickets</h3>
                  <button onClick={() => setShowTicketForm(!showTicketForm)} className="btn btn-sm btn-secondary">
                    {showTicketForm ? 'Cancel' : '+ New Ticket'}
                  </button>
                </div>

                {showTicketForm && (
                  <div className="bg-base-200 rounded-lg p-4 mb-4">
                    <div className="mb-3">
                      <label className="label">
                        <span className="label-text font-semibold">Subject</span>
                      </label>
                      <input type="text" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)}
                        className="input input-bordered input-sm w-full" placeholder="Brief description of issue" />
                    </div>

                    <div className="mb-3">
                      <label className="label">
                        <span className="label-text font-semibold">Description</span>
                      </label>
                      <textarea value={ticketDescription} onChange={e => setTicketDescription(e.target.value)}
                        className="textarea textarea-bordered w-full" rows="4"
                        placeholder="Provide details about your issue or question..."></textarea>
                    </div>

                    <div className="mb-3">
                      <label className="label">
                        <span className="label-text font-semibold">Priority</span>
                      </label>
                      <select value={ticketPriority} onChange={e => setTicketPriority(e.target.value)}
                        className="select select-bordered select-sm w-full">
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>

                    <button onClick={submitTicket} className="btn btn-secondary btn-sm w-full">Submit Ticket</button>
                  </div>
                )}

                <div>
                  <p className="text-sm font-semibold mb-2">My Tickets</p>
                  {myTickets.length === 0 ? (
                    <div className="text-center py-6 opacity-60">
                      <span className="text-3xl">🎫</span>
                      <p className="mt-2 text-sm">No tickets submitted yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {myTickets.map(t => (
                        <div key={t._id} className="bg-base-200 rounded-lg p-3">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold text-sm">{t.subject}</div>
                            <div className="flex gap-1">
                              <span className={`badge badge-xs ${
                                t.priority === 'high' ? 'badge-error' :
                                t.priority === 'medium' ? 'badge-warning' : 'badge-info'
                              }`}>{t.priority}</span>
                              <span className={`badge badge-xs ${
                                t.status === 'resolved' || t.status === 'closed' ? 'badge-success' :
                                t.status === 'in-progress' ? 'badge-warning' : 'badge-ghost'
                              }`}>{t.status}</span>
                            </div>
                          </div>
                          <p className="text-xs opacity-60 mb-2">{formatDateTime(t.createdAt)}</p>
                          <p className="text-sm mb-2">{t.description}</p>
                          {t.response && (
                            <div className="mt-2 p-2 bg-success/10 rounded border-l-4 border-success">
                              <p className="text-xs font-semibold text-success mb-1">
                                Response from {t.respondedBy?.firstName} {t.respondedBy?.lastName}:
                              </p>
                              <p className="text-xs">{t.response}</p>
                              <p className="text-xs opacity-60 mt-1">{formatDateTime(t.respondedAt)}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;
