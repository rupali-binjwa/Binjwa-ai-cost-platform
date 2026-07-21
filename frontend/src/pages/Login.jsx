import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import { Zap, Layers, Building2, UserCircle, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'super_admin';
  const [activeTab, setActiveTab] = useState(initialRole);
  
  const [email, setEmail] = useState(
    initialRole === 'super_admin' ? 'admin@binjwa.com' :
    initialRole === 'client_admin' ? 'clientadmin@binjwa.com' : 'employee@binjwa.com'
  );
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSetupMode, setIsSetupMode] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleTabChange = (role) => {
    setActiveTab(role);
    setError(null);
    if (role === 'super_admin') {
      setEmail('admin@binjwa.com');
    } else if (role === 'client_admin') {
      setEmail(''); // Clear for real use case
    } else {
      setEmail('employee@binjwa.com');
    }
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isSetupMode) {
        if (activeTab === 'client_admin' && companyName) {
          await authAPI.signup(companyName, email, phone, password);
          setSuccess(true);
          setTimeout(() => {
            setIsSetupMode(false);
            setSuccess(false);
            setPassword('');
            setError('Account created successfully! You can now log in.');
          }, 1500);
        } else {
          await authAPI.setupPassword(email, password, companyName, phone);
          setSuccess(true);
          setTimeout(() => {
            setIsSetupMode(false);
            setSuccess(false);
            setPassword('');
            setError('Password setup successful! You can now log in.');
          }, 1500);
        }
      } else {
        const res = await authAPI.login(email, password);
        localStorage.setItem('access_token', res.access_token);
        localStorage.setItem('user_role', res.role);
        localStorage.setItem('user_id', res.user_id);
        localStorage.setItem('user_name', res.name || email);
        if (res.organization_id) {
          localStorage.setItem('organization_id', res.organization_id);
        } else {
          localStorage.removeItem('organization_id');
        }

        setSuccess(true);
        setTimeout(() => {
          if (res.role === 'super_admin') navigate('/super-admin');
          else if (res.role === 'client_admin') navigate('/client-admin');
          else navigate('/employee');
        }, 600);
      }
    } catch (err) {
      if (err.message === 'SETUP_REQUIRED') {
        setError('You must setup your password first.');
        setIsSetupMode(true);
      } else {
        if (isSetupMode && err.message.includes('Email not found')) {
          setError("Authentication fail. Mail doesn't added.");
        } else {
          setError(err.message || (isSetupMode ? 'Setup failed.' : 'Login failed. Please check your credentials.'));
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '85vh' }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', borderRadius: '24px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg, var(--primary), var(--accent))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'white', marginBottom: '1rem', boxShadow: '0 8px 20px rgba(99, 102, 241, 0.4)' }}>
            <Zap size={28} />
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-0.02em' }}>{isSetupMode ? "Setup Account" : "Welcome Back"}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>Select your role portal and authenticate to continue</p>
        </div>

        {/* Role Portal Tabs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', background: 'rgba(15, 23, 42, 0.05)', padding: '6px', borderRadius: '12px', marginBottom: '1.75rem' }}>
          <button 
            type="button"
            onClick={() => handleTabChange('super_admin')}
            style={{ 
              padding: '0.6rem 0.4rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: activeTab === 'super_admin' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'super_admin' ? 'white' : 'var(--text-main)',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={14} /> Super Admin
          </button>
          <button 
            type="button"
            onClick={() => handleTabChange('client_admin')}
            style={{ 
              padding: '0.6rem 0.4rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: activeTab === 'client_admin' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'client_admin' ? 'white' : 'var(--text-main)',
              transition: 'all 0.2s'
            }}
          >
            <Building2 size={14} /> Client Admin
          </button>
          <button 
            type="button"
            onClick={() => handleTabChange('employee')}
            style={{ 
              padding: '0.6rem 0.4rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              background: activeTab === 'employee' ? 'var(--success)' : 'transparent',
              color: activeTab === 'employee' ? 'white' : 'var(--text-main)',
              transition: 'all 0.2s'
            }}
          >
            <UserCircle size={14} /> Employee
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: 'var(--danger)', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', color: 'var(--success)', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18} /> Authentication successful! Redirecting...
          </div>
        )}

        {activeTab === 'client_admin' && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', justifyContent: 'center' }}>
            <button 
              type="button" 
              onClick={() => { setIsSetupMode(false); setError(null); }}
              style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--border-color)', background: !isSetupMode ? 'var(--accent)' : 'transparent', color: !isSetupMode ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Log In
            </button>
            <button 
              type="button" 
              onClick={() => { setIsSetupMode(true); setError(null); }}
              style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '1px solid var(--border-color)', background: isSetupMode ? 'var(--accent)' : 'transparent', color: isSetupMode ? 'white' : 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
            >
              Sign Up
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {isSetupMode && activeTab === 'client_admin' && (
            <>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Organization Name</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)', background: 'rgba(99, 102, 241, 0.02)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
                  required 
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '8px' }}>Phone Number</label>
                <input 
                  type="text" 
                  style={{ width: '100%', padding: '0.875rem 1rem', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)', background: 'rgba(99, 102, 241, 0.02)', color: 'var(--text-main)', fontSize: '1rem', outline: 'none' }}
                  required 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 234 567 8900"
                />
              </div>
            </>
          )}

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="label">Portal Email Address</label>
            <input 
              type="email" 
              className="input" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="label">Password</label>
            <input 
              type="password" 
              className="input" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%', padding: '1rem', fontSize: '1.05rem', 
              background: activeTab === 'super_admin' ? 'var(--primary)' :
                          activeTab === 'client_admin' ? 'var(--accent)' :
                          'var(--success)'
            }} 
            disabled={loading || success}
          >
            {loading ? 'Authenticating...' : (isSetupMode ? `Setup Account` : `Access ${activeTab.replace('_', ' ').toUpperCase()} Portal`)} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(15, 23, 42, 0.05)', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          <strong>Default Seed Credentials:</strong><br />
          Super Admin: <code>admin@binjwa.com</code> / <code>Admin@123</code><br />
          Client Admin: <code>clientadmin@binjwa.com</code> / <code>Admin@123</code><br />
          Employee: <code>employee@binjwa.com</code> / <code>Admin@123</code>
        </div>
      </div>
    </div>
  );
}
