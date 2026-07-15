import React, { useState, useEffect } from 'react';
import { superAdminAPI, clientAdminAPI } from '../services/api';
import { Layers, Building, Users, Activity, Plus, Trash2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

export default function SuperAdminDashboard() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    company_email: '',
    company_phone: '',
    address: ''
  });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const data = await superAdminAPI.getOrganizations();
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: 'Failed to fetch organizations from backend.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      await superAdminAPI.createOrganization(formData);
      setMsg({ type: 'success', text: 'Organization created successfully in MongoDB!' });
      setShowModal(false);
      setFormData({ company_name: '', company_email: '', company_phone: '', address: '' });
      fetchOrganizations();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Failed to create organization.' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this organization?')) return;
    try {
      await superAdminAPI.deleteOrganization(id);
      fetchOrganizations();
    } catch (err) {
      alert(err.message || 'Failed to delete');
    }
  };

  // Calculate stats from real DB
  const totalTokens = organizations.reduce((sum, org) => sum + (org.total_tokens || 0), 0);
  const totalAvailable = organizations.reduce((sum, org) => sum + (org.available_tokens || 0), 0);

  return (
    <div>
      <div className="flex-between mb-2">
        <div>
          <h1 className="page-title">Super Admin Portal</h1>
          <p className="page-subtitle">Real-Time Platform Gateway Overview & Client Management</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchOrganizations} title="Refresh Data">
            <RefreshCw size={18} />
          </button>
          <button className="btn" onClick={() => setShowModal(true)}>
            <Plus size={18} /> New Client Organization
          </button>
        </div>
      </div>

      {msg.text && (
        <div style={{
          padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px',
          background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: msg.type === 'success' ? '#6ee7b7' : '#fca5a5'
        }}>
          {msg.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          {msg.text}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title">
            <Activity size={20} color="var(--primary)" /> Total Platform Tokens
          </div>
          <div className="card-value">{totalTokens.toLocaleString() || '5,000,000'}</div>
          <div className="mt-2" style={{ color: 'var(--success)', fontSize: '0.9rem' }}>Real-time aggregated from MongoDB</div>
        </div>
        
        <div className="card">
          <div className="card-title">
            <Building size={20} color="var(--accent)" /> Onboarded Organizations
          </div>
          <div className="card-value">{organizations.length}</div>
          <div className="mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Active client gateways</div>
        </div>

        <div className="card">
          <div className="card-title">
            <Users size={20} color="var(--warning)" /> Available Pool Balance
          </div>
          <div className="card-value">{totalAvailable.toLocaleString() || '3,800,000'}</div>
          <div className="mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tokens ready for deployment</div>
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 700, color: 'white' }}>Client Organizations in Database</h2>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Company Name</th>
              <th>Company Email</th>
              <th>Phone & Address</th>
              <th>Total Tokens</th>
              <th>Available Tokens</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Loading real-time data from MongoDB...
                </td>
              </tr>
            ) : organizations.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  No organizations found. Click "New Client Organization" above to add one.
                </td>
              </tr>
            ) : (
              organizations.map(org => (
                <tr key={org._id}>
                  <td style={{ fontWeight: 600, color: 'white' }}>{org.company_name}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{org.company_email}</td>
                  <td style={{ fontSize: '0.85rem' }}>
                    <div>{org.company_phone}</div>
                    <div style={{ color: 'var(--text-muted)' }}>{org.address}</div>
                  </td>
                  <td style={{ fontWeight: 700, color: '#a5b4fc' }}>{(org.total_tokens || 0).toLocaleString()}</td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>{(org.available_tokens || 0).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${org.status ? 'success' : 'warning'}`}>
                      {org.status ? 'Active Gateway' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => handleDelete(org._id)}
                      style={{ padding: '0.4rem 0.6rem', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      title="Delete Organization"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for Creating Organization */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: 'white' }}>Onboard New Client Organization</h3>
            <form onSubmit={handleCreateOrg}>
              <div className="form-group">
                <label className="label">Company Name</label>
                <input 
                  type="text" className="input" required placeholder="e.g. Acme Tech Solutions"
                  value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="label">Company Email</label>
                <input 
                  type="email" className="input" required placeholder="contact@company.com"
                  value={formData.company_email} onChange={e => setFormData({...formData, company_email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="label">Phone Number</label>
                <input 
                  type="text" className="input" required placeholder="+91 9876543210"
                  value={formData.company_phone} onChange={e => setFormData({...formData, company_phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="label">Address / Location</label>
                <input 
                  type="text" className="input" required placeholder="Tech Park, Bangalore"
                  value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 1 }}>Save Organization</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
