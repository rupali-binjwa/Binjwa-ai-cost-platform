import React, { useState, useEffect } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { FileText } from 'lucide-react';

function UsageLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // In a real app, this would fetch from http://localhost:8000/usage-logs/all
    // For now we'll simulate the fetch delay and use mock data
    const fetchLogs = async () => {
      try {
        // Mock data to show the UI
        setTimeout(() => {
          setLogs([
            { _id: '1', organization_id: 'Org-TechNova', employee_id: 'Emp-A', model_id: 'Gemini 2.0 Flash', input_tokens: 1200, output_tokens: 800, total_tokens: 2000, total_cost: 0.005, date_and_time: new Date().toISOString() },
            { _id: '2', organization_id: 'Org-TechNova', employee_id: 'Emp-B', model_id: 'GPT-4', input_tokens: 500, output_tokens: 200, total_tokens: 700, total_cost: 0.021, date_and_time: new Date().toISOString() },
            { _id: '3', organization_id: 'Org-DesignCorp', employee_id: 'Emp-C', model_id: 'Claude 3', input_tokens: 2500, output_tokens: 1500, total_tokens: 4000, total_cost: 0.060, date_and_time: new Date().toISOString() }
          ]);
          setLoading(false);
        }, 800);
      } catch (err) {
        setError('Failed to fetch usage logs');
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div>
      <h1 className="page-title">Usage Logs</h1>
      <p className="page-subtitle">Track and monitor AI model consumption across your organization.</p>
      
      {loading ? (
        <div style={{padding: '2rem', textAlign: 'center', color: 'var(--text-muted)'}}>Loading logs...</div>
      ) : error ? (
        <div style={{color: 'red'}}>{error}</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Organization</th>
                <th>Model</th>
                <th>Total Tokens</th>
                <th>Cost ({EXCHANGE_RATES[currency].symbol})</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log._id}>
                  <td>
                    <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                      <FileText size={16} color="var(--text-muted)" />
                      <span style={{fontSize: '0.875rem', fontFamily: 'monospace'}}>{log._id}</span>
                    </div>
                  </td>
                  <td>{log.organization_id}</td>
                  <td><span className="badge">{log.model_id}</span></td>
                  <td>{log.total_tokens.toLocaleString()}</td>
                  <td style={{fontWeight: '500'}}>{formatCurrency(log.total_cost, 3)}</td>
                  <td style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>
                    {new Date(log.date_and_time).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default UsageLogs;
