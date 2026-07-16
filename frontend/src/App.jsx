import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layers, Zap, Building2, UserCircle, LogOut, KeyRound } from 'lucide-react';

import SuperAdminDashboard from './pages/SuperAdminDashboard';
import SuperAdminPricing from './pages/SuperAdminPricing';
import ClientAdminDashboard from './pages/ClientAdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { currency, setCurrency, EXCHANGE_RATES } = useCurrency();
  
  if (location.pathname === '/' || location.pathname === '/login') return null;

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const storedRole = localStorage.getItem('user_role') || 'Super Admin';
  const storedName = localStorage.getItem('user_name') || 'User';

  return (
    <nav className="header">
      <Link to="/" style={{textDecoration: 'none'}}>
        <div className="header-title">
          <img src="/logo.png" alt="Binjwa Logo" style={{ height: '40px', objectFit: 'contain' }} />
        </div>
      </Link>
      <div className="nav-links">
        {storedRole === 'super_admin' && (
          <Link to="/super-admin" className={`nav-link ${location.pathname === '/super-admin' ? 'active' : ''}`}>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <Layers size={16} /> Super Admin
            </div>
          </Link>
        )}
        {storedRole === 'client_admin' && (
          <Link to="/client-admin" className={`nav-link ${location.pathname === '/client-admin' ? 'active' : ''}`}>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <Building2 size={16} /> Client Admin (Gateway)
            </div>
          </Link>
        )}
        {storedRole === 'employee' && (
          <Link to="/employee" className={`nav-link ${location.pathname === '/employee' ? 'active' : ''}`}>
            <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
              <UserCircle size={16} /> Employee / Agent
            </div>
          </Link>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--bg-main)', padding: '0.2rem 0.5rem', borderRadius: '6px', border: '1px solid var(--primary)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 'bold' }}>CURRENCY:</span>
          <select 
            style={{ background: 'transparent', color: 'var(--primary)', border: 'none', outline: 'none', cursor: 'pointer', fontWeight: 'bold' }}
            value={currency} 
            onChange={e => setCurrency(e.target.value)}
          >
            {Object.keys(EXCHANGE_RATES).map(c => <option key={c} value={c} style={{ color: 'black' }}>{c} ({EXCHANGE_RATES[c].symbol})</option>)}
          </select>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
          Logged in: <strong style={{ color: 'var(--text-main)' }}>{storedName}</strong>
        </span>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#fca5a5' }}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </nav>
  );
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', background: '#fee2e2', minHeight: '100vh' }}>
          <h1>Something went wrong.</h1>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <CurrencyProvider>
      <BrowserRouter>
        <div className="container">
          <Navigation />
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/super-admin" element={<SuperAdminDashboard />} />
              <Route path="/client-admin" element={<ClientAdminDashboard />} />
              <Route path="/employee" element={<EmployeeDashboard />} />
            </Routes>
          </ErrorBoundary>
        </div>
      </BrowserRouter>
    </CurrencyProvider>
  );
}

export default App;
