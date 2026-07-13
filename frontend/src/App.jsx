import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import UsageLogs from './pages/UsageLogs';
import Recommendations from './pages/Recommendations';
import { Activity, Zap } from 'lucide-react';

function Navigation() {
  const location = useLocation();
  return (
    <nav className="header">
      <div className="header-title" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
        <div style={{width: 32, height: 32, background: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'}}>
          <Activity size={18} />
        </div>
        Binjwa AI Cost
      </div>
      <div className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Usage Logs</Link>
        <Link to="/recommend" className={`nav-link ${location.pathname === '/recommend' ? 'active' : ''}`}>Model Recommendations</Link>
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
          <Route path="/" element={<UsageLogs />} />
          <Route path="/recommend" element={<Recommendations />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
