import React, { useState, useEffect, useRef } from 'react';
import { useCurrency } from '../context/CurrencyContext';
import { usageLogAPI, modelsAPI, employeeAPI, chatAPI } from '../services/api';
import { UserCircle, Zap, Activity, Clock, Play, CheckCircle, Terminal, Bot, Send } from 'lucide-react';

export default function EmployeeDashboard() {
  const { formatCurrency } = useCurrency();
  const [logs, setLogs] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [employeeInfo, setEmployeeInfo] = useState(null);

  // Chat state
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const messagesEndRef = useRef(null);

  const storedEmpId = localStorage.getItem('user_id');
  const storedOrgId = localStorage.getItem('organization_id');
  const storedName = localStorage.getItem('user_name') || 'Employee (AI Agent)';

  const fetchData = async () => {
    try {
      const [logsRes, modelsRes, empRes] = await Promise.all([
        usageLogAPI.getAllLogs().catch(() => null),
        modelsAPI.getAllModels().catch(() => null),
        storedEmpId ? employeeAPI.getEmployee(storedEmpId).catch(() => null) : Promise.resolve(null)
      ]);

      if (empRes) setEmployeeInfo(empRes);

      const logList = logsRes && logsRes.usage_logs ? logsRes.usage_logs : [];
      const myLogs = storedEmpId ? logList.filter(l => l.employee_id === storedEmpId) : [];
      setLogs(myLogs);

      const modelList = modelsRes && modelsRes.models ? modelsRes.models : [];
      const allowedProviders = ['groq', 'openai', 'google'];
      const filteredModels = modelList.filter(m => {
        const p = (m.provider || '').toLowerCase();
        const n = (m.model_name || '').toLowerCase();
        return p.includes('groq') || 
               p.includes('openai') || n.includes('gpt') || 
               p.includes('google') || n.includes('gemini');
      });
      setModels(filteredModels);
      if (filteredModels.length > 0 && !selectedModel) {
        setSelectedModel(filteredModels[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || !selectedModel) return;

    const userMessage = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt('');
    setRunning(true);
    setMsg({ type: '', text: '' });

    try {
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await chatAPI.sendMessage({
        messages: allMessages,
        model_id: selectedModel,
        organization_id: storedOrgId,
        employee_id: storedEmpId
      });

      const botMessage = {
        role: 'bot',
        content: response.reply,
        usage: response.usage,
        model_used: response.model_used
      };

      setMessages(prev => [...prev, botMessage]);
      setMsg({ type: 'success', text: `Message sent via ${response.model_used}. Used ${response.usage.total_tokens} tokens (${formatCurrency(response.usage.cost, 5)})` });

      // Refresh to update logs and token allowance
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error communicating with AI Gateway' });
      // Remove the user message if it failed, or show an error message
    } finally {
      setRunning(false);
    }
  };

  const totalUsedByMe = logs.reduce((sum, l) => sum + (l.total_tokens || 0), 0);
  const totalCostByMe = logs.reduce((sum, l) => sum + (l.total_cost || 0), 0);

  const selectedModelObj = models.find(m => m._id === selectedModel);
  const selectedProvider = selectedModelObj ? selectedModelObj.provider : '';
  
  let platformData = null;
  if (employeeInfo && employeeInfo.platform_allocations && selectedProvider) {
    platformData = employeeInfo.platform_allocations[selectedProvider];
    if (!platformData) {
      const matchKey = Object.keys(employeeInfo.platform_allocations).find(k => 
        k.toLowerCase().includes(selectedProvider.toLowerCase()) || 
        selectedProvider.toLowerCase().includes(k.toLowerCase().split(' ')[0])
      );
      if (matchKey) {
        platformData = employeeInfo.platform_allocations[matchKey];
      }
    }
  }
  
  const canUse = platformData && platformData.available > 0;

  return (
    <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      <div className="flex-between mb-2">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge success" style={{ fontSize: '0.8rem' }}>Employee / Agent Account</span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: 'white', fontWeight: 600 }}>{storedName}</span>
          </div>
          <h1 className="page-title" style={{ marginTop: '4px' }}>AI Live Chat & Telemetry</h1>
          <p className="page-subtitle">Chat with real LLMs via Binjwa Gateway and monitor exact token deduction.</p>
        </div>
      </div>

      {msg.text && (
        <div style={{
          padding: '1rem', borderRadius: '12px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px',
          background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: msg.type === 'success' ? '#6ee7b7' : '#fca5a5'
        }}>
          <CheckCircle size={20} /> {msg.text}
        </div>
      )}

      <div className="dashboard-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="card">
          <div className="card-title">
            <Zap size={20} color="var(--primary)" /> My Token Allowance
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '0.5rem' }}>
            {employeeInfo && employeeInfo.platform_allocations && Object.keys(employeeInfo.platform_allocations).length > 0 ? (
              Object.entries(employeeInfo.platform_allocations).map(([platform, data]) => (
                <div key={platform} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-main)', padding: '0.5rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{platform}</span>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: data.available > 0 ? 'var(--success)' : 'var(--error)' }}>
                      {formatCurrency(data.available, 0).replace('$', '')} left
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>of {formatCurrency(data.allocated, 0).replace('$', '')} total</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No platform tokens assigned. Contact your Client Admin.</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <Activity size={20} color="var(--accent)" /> Tokens Consumed by Me
          </div>
          <div className="card-value">{formatCurrency(totalUsedByMe, 0).replace('$', '')} Tokens</div>
          <div className="mt-2" style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>
            Lifetime Cost: {formatCurrency(totalCostByMe, 4)}
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <Clock size={20} color="var(--warning)" /> Gateway Logged Tasks
          </div>
          <div className="card-value">{logs.length} API Calls</div>
          <div className="mt-2" style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Live requests synced to Database</div>
        </div>
      </div>

      {/* Two Column Layout: Chat Interface | Real-Time Logs */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '1.5rem', flex: 1, minHeight: '500px' }}>

        {/* Chat UI */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'black', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot color="var(--primary)" /> Enterprise Chat Gateway
            </div>
            <select
              className="input"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={{ background: 'var(--bg-main)', color: 'black', width: '200px', padding: '0.4rem', fontSize: '0.85rem' }}
            >
              {models.map(m => (
                <option key={m._id} value={m._id}>{m.model_name} ({m.provider})</option>
              ))}
            </select>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
            {messages.length === 0 ? (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Bot size={48} style={{ opacity: 0.3, marginBottom: '1rem', margin: '0 auto' }} />
                <p>Select a model and start sending messages.</p>
                <p style={{ fontSize: '0.8rem' }}>Tokens will be deducted from your live balance.</p>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div key={idx} style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  background: m.role === 'user' ? 'var(--primary)' : 'rgba(15, 23, 42, 0.05)',
                  padding: '1rem',
                  borderRadius: '12px',
                  borderBottomRightRadius: m.role === 'user' ? '0' : '12px',
                  borderBottomLeftRadius: m.role === 'bot' ? '0' : '12px',
                }}>
                  <div style={{ fontSize: '0.75rem', color: m.role === 'user' ? 'rgba(255, 255, 255, 0.8)' : 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
                    {m.role === 'user' ? 'You' : `AI Gateway (${m.model_used})`}
                  </div>
                  <div style={{ color: m.role === 'user' ? 'white' : 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {m.content}
                  </div>
                  {m.role === 'bot' && m.usage && (
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid rgba(0,0,0,0.1)', fontSize: '0.75rem', color: '#059669', display: 'flex', gap: '15px', fontWeight: 600 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={12} /> Used: {m.usage.total_tokens} Tokens</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Activity size={12} /> Cost: {formatCurrency(m.usage.cost, 5)}</span>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '10px' }}>
              {messages.length > 0 && (
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.3rem 0.8rem' }}
                  onClick={() => { setMessages([]); localStorage.removeItem('chat_history'); }}
                >
                  Clear Chat History
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
            {!canUse && (
              <div style={{ color: 'var(--error)', fontSize: '0.85rem', fontWeight: 600 }}>
                You do not have any tokens allocated for {selectedProvider}. Please contact your Admin.
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                className="input"
                placeholder={running ? "AI is processing..." : "Type your prompt here..."}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                disabled={running || !canUse}
                style={{ flex: 1, background: 'var(--bg-main)' }}
              />
              <button type="submit" className="btn btn-primary" disabled={running || !prompt.trim() || !canUse} style={{ padding: '0 1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} /> {running ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Logs Table Sidebar */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', padding: '1rem' }}>
          <div style={{ marginBottom: '1rem', fontSize: '1rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            <Clock color="var(--warning)" size={18} /> Real-Time Gateway Logs
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {logs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No API calls yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {logs.slice().reverse().map((log, idx) => (
                  <div key={log._id || idx} style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {new Date(log.date_and_time || Date.now()).toLocaleTimeString()}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>
                        ${log.total_cost || '0.000'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'white', fontWeight: 600, marginBottom: '4px' }}>
                      {log.task_type || 'Live Chat'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      In: <span style={{ color: '#a5b4fc' }}>{log.input_tokens || 0}</span> |
                      Out: <span style={{ color: '#f472b6' }}>{log.output_tokens || 0}</span> |
                      Total: <span style={{ color: 'white' }}>{log.total_tokens || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
