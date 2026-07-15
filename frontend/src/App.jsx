import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { Layers, Zap, Building2, UserCircle, LogOut, KeyRound } from 'lucide-react';

import SuperAdminDashboard from './pages/SuperAdminDashboard';
import ClientAdminDashboard from './pages/ClientAdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';

function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  
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
          <div className="logo-icon">
            <Zap size={20} />
          </div>
          Binjwa AI Gateway
        </div>
      </Link>
      <div className="nav-links">
        <Link to="/super-admin" className={`nav-link ${location.pathname === '/super-admin' ? 'active' : ''}`}>
          <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
            <Layers size={16} /> Super Admin
          </div>
        </Link>
        <Link to="/client-admin" className={`nav-link ${location.pathname === '/client-admin' ? 'active' : ''}`}>
          <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
            <Building2 size={16} /> Client Admin (Gateway)
          </div>
        </Link>
        <Link to="/employee" className={`nav-link ${location.pathname === '/employee' ? 'active' : ''}`}>
          <div style={{display: 'flex', alignItems: 'center', gap: '6px'}}>
            <UserCircle size={16} /> Employee / Agent
          </div>
        </Link>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Logged in: <strong style={{ color: 'white' }}>{storedName}</strong>
        </span>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', color: '#fca5a5' }}>
          <LogOut size={14} /> Logout
        </button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="container">
        <Navigation />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/super-admin" element={<SuperAdminDashboard />} />
          <Route path="/client-admin" element={<ClientAdminDashboard />} />
          <Route path="/employee" element={<EmployeeDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
