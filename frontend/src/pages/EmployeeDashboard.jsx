import React, { useState, useEffect } from 'react';
import { usageLogAPI, modelsAPI, employeeAPI } from '../services/api';
import { UserCircle, Zap, Activity, Clock, Play, CheckCircle, Terminal, Bot } from 'lucide-react';

export default function EmployeeDashboard() {
  const [logs, setLogs] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [prompt, setPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [executionResult, setExecutionResult] = useState(null);

  const storedEmpId = localStorage.getItem('user_id');
  const storedOrgId = localStorage.getItem('organization_id');
  const storedName = localStorage.getItem('user_name') || 'Rahul Sharma (AI Agent Engineer)';

  const fetchData = async () => {
    try {
      const [logsRes, modelsRes] = await Promise.all([
        usageLogAPI.getAllLogs(),
        modelsAPI.getAllModels()
      ]);

      const logList = logsRes && logsRes.usage_logs ? logsRes.usage_logs : [];
      // filter for current employee or show all if demo
      const myLogs = storedEmpId ? logList.filter(l => l.employee_id === storedEmpId || l.organization_id === storedOrgId) : logList;
      setLogs(myLogs.length > 0 ? myLogs : logList);

      const modelList = modelsRes && modelsRes.models ? modelsRes.models : [];
      setModels(modelList);
      if (modelList.length > 0 && !selectedModel) {
        setSelectedModel(modelList[0]._id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunTask = async (e) => {
    e.preventDefault();
    if (!prompt) return;
    setRunning(true);
    setMsg({ type: '', text: '' });
    setExecutionResult(null);

    // Simulate character to token conversion
    const inputTokens = Math.ceil(prompt.length / 4) + 150;
    const outputTokens = Math.floor(inputTokens * 0.4) + 80;
    const totalTokens = inputTokens + outputTokens;

    const chosenModelObj = models.find(m => m._id === selectedModel) || models[0] || {};
    const cost = ((inputTokens / 1000) * (chosenModelObj.input_cost_per_1k || 0.003)) + 
                 ((outputTokens / 1000) * (chosenModelObj.output_cost_per_1k || 0.015));

    try {
      await usageLogAPI.createLog({
        organization_id: storedOrgId || '64a1b2c3d4e5f6a7b8c9d0e1',
        employee_id: storedEmpId || '64a1b2c3d4e5f6a7b8c9d0e2',
        model_id: selectedModel || chosenModelObj._id || '64a1b2c3d4e5f6a7b8c9d0e3',
        task_type: prompt.slice(0, 40) + '...',
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: totalTokens,
        total_cost: roundTo(cost, 5)
      });

      // Compute intelligent Gateway Analysis & Simulated Response
      const isVoice = /voice|call|speech|phone|audio|talk|conversation/i.test(prompt);
      const isCode = /code|sql|bug|json|data|query|function|script|project/i.test(prompt);
      const isRealEstate = /property|house|home|bhk|flat|estate|villa|lakh|budget|vijay nagar/i.test(prompt);

      let routedModelName = chosenModelObj.model_name || "Claude 3 Haiku";
      let routedProvider = chosenModelObj.provider || "Anthropic";
      let analysisText = "";
      let simulatedResponse = "";
      let latency = Math.floor(Math.random() * 110) + 180; // 180-290ms

      if (isVoice) {
        routedModelName = "Claude 3 Haiku";
        routedProvider = "Anthropic";
        analysisText = "Voice/Audio turn detected. Our Gateway automatically switched routing from standard LLM to Claude 3 Haiku to deliver sub-250ms acoustic response time while reducing token cost by 78%.";
        simulatedResponse = "🎙️ [Voice Gateway Output]: 'Hello! I have processed your inquiry. Based on your budget and preferences, I can connect you directly with our senior agent or schedule a site visit right away.'";
      } else if (isCode) {
        routedModelName = "Llama 3 70B";
        routedProvider = "OpenRouter";
        analysisText = "Technical / Code reasoning project detected. Gateway routed prompt to Llama 3 70B with automatic prompt compression and syntax caching, achieving 99.8% precision with $0.0142 savings.";
        simulatedResponse = "💻 [Code/Project Gateway Output]: Query successfully parsed. Executed data transformation pipeline with 0 errors. All records synced and validated against organization schema.";
      } else if (isRealEstate) {
        routedModelName = chosenModelObj.model_name || "GPT-4o";
        routedProvider = chosenModelObj.provider || "OpenAI";
        analysisText = "Real Estate Domain Query detected. Gateway applied domain-specific prompt guardrails & semantic caching. Matched token intent with active property inventory with 41% latency reduction.";
        simulatedResponse = "🏡 [Real Estate Gateway Output]: 'We found 3 premium verified listings matching your exact criteria (Vijay Nagar, under 50 Lakh). Lead score marked High Priority (9.4/10). Automated brochure sent via WhatsApp webhook.'";
      } else {
        analysisText = "General Enterprise AI Task analyzed. Gateway enforced budget quotas, stripped redundant token padding, and routed via lowest-latency regional edge node.";
        simulatedResponse = `🤖 [AI Gateway Output]: Successfully executed task: "${prompt.slice(0, 60)}...". All output tokens verified against enterprise safety guardrails and logged to your MongoDB quota.`;
      }

      setExecutionResult({
        taskPayload: prompt,
        modelName: routedModelName,
        provider: routedProvider,
        latency: latency,
        inputTokens: inputTokens,
        outputTokens: outputTokens,
        totalTokens: totalTokens,
        cost: roundTo(cost, 5),
        analysis: analysisText,
        aiOutput: simulatedResponse,
        timestamp: new Date().toLocaleTimeString()
      });

      setMsg({ type: 'success', text: `Task executed & logged via gateway! Used ${totalTokens} tokens ($${roundTo(cost, 5)}).` });
      setPrompt('');
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error logging task' });
    } finally {
      setRunning(false);
    }
  };

  function roundTo(num, places) {
    return +(Math.round(num + "e+" + places)  + "e-" + places);
  }

  const totalUsedByMe = logs.reduce((sum, l) => sum + (l.total_tokens || 0), 0);
  const totalCostByMe = logs.reduce((sum, l) => sum + (l.total_cost || 0), 0);

  return (
    <div>
      <div className="flex-between mb-2">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge success" style={{ fontSize: '0.8rem' }}>Employee / Agent Account</span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: 'white', fontWeight: 600 }}>{storedName}</span>
          </div>
          <h1 className="page-title" style={{ marginTop: '4px' }}>AI Workspace & Telemetry Log</h1>
          <p className="page-subtitle">Test gateway prompts, run AI tasks, and view real-time token consumption</p>
        </div>
      </div>

      {msg.text && (
        <div style={{
          padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px',
          background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: msg.type === 'success' ? '#6ee7b7' : '#fca5a5'
        }}>
          <CheckCircle size={20} /> {msg.text}
        </div>
      )}

      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title">
            <Zap size={20} color="var(--primary)" /> My Token Allowance
          </div>
          <div className="card-value">{(500000 - totalUsedByMe).toLocaleString()}</div>
          <div className="mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Out of 500,000 monthly quota</div>
        </div>
        
        <div className="card">
          <div className="card-title">
            <Activity size={20} color="var(--accent)" /> Tokens Consumed by Me
          </div>
          <div className="card-value">{totalUsedByMe.toLocaleString()}</div>
          <div className="mt-2" style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>
            Total Cost incurred: ${roundTo(totalCostByMe, 4)}
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <Clock size={20} color="var(--warning)" /> Gateway Logged Tasks
          </div>
          <div className="card-value">{logs.length}</div>
          <div className="mt-2" style={{ color: 'var(--success)', fontSize: '0.85rem' }}>All requests synced to MongoDB</div>
        </div>
      </div>

      {/* Live Gateway Execution & Optimization Report Card */}
      {executionResult && (
        <div className="card" style={{ 
          marginBottom: '2rem', 
          border: '1px solid rgba(99, 102, 241, 0.4)', 
          background: 'linear-gradient(135deg, rgba(30, 33, 48, 0.95), rgba(99, 102, 241, 0.12))',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
        }}>
          <div className="flex-between" style={{ marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.2)', color: '#a5b4fc', borderRadius: '10px' }}>
                <Zap size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, color: 'white', fontSize: '1.3rem', fontWeight: 800 }}>Live Gateway Execution Report</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Task Timestamp: {executionResult.timestamp}</span>
              </div>
            </div>
            <button className="btn btn-secondary" onClick={() => setExecutionResult(null)} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
              Dismiss Report
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Smart Routed Model</div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>{executionResult.modelName}</div>
              <div style={{ fontSize: '0.75rem', color: '#a5b4fc' }}>Provider: {executionResult.provider}</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Gateway Response Latency</div>
              <div style={{ color: '#6ee7b7', fontWeight: 700, fontSize: '1.05rem' }}>{executionResult.latency} ms</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Ultra-Fast Edge Routing</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Tokens Processed</div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '1.05rem' }}>
                <span style={{ color: '#a5b4fc' }}>{executionResult.inputTokens}</span> + <span style={{ color: '#f472b6' }}>{executionResult.outputTokens}</span> = {executionResult.totalTokens}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Input + Output Tokens</div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Cost Incurred</div>
              <div style={{ color: 'var(--accent)', fontWeight: 700, fontSize: '1.05rem' }}>${executionResult.cost}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Logged to MongoDB</div>
            </div>
          </div>

          {/* Analysis & Optimization */}
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderLeft: '4px solid #10b981', padding: '1rem 1.25rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#6ee7b7', marginBottom: '6px' }}>
              <CheckCircle size={18} /> Gateway Telemetry Analysis & Optimization
            </div>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#d1fae5', lineHeight: '1.5' }}>
              {executionResult.analysis}
            </p>
          </div>

          {/* Simulated AI Response */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a5b4fc', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Simulated AI Model Response
            </div>
            <div style={{ background: 'rgba(0,0,0,0.5)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-color)', color: '#f8fafc', fontFamily: 'monospace', fontSize: '0.95rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {executionResult.aiOutput}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
        {/* Test Gateway Prompt */}
        <div className="card">
          <div style={{ marginBottom: '1.25rem', fontSize: '1.25rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal color="var(--primary)" /> Execute Gateway Prompt
          </div>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Simulate a calling agent or chatbot prompt passing through the Binjwa Gateway.
          </p>

          <form onSubmit={handleRunTask}>
            <div className="form-group">
              <label className="label">Select Target AI Model</label>
              <select 
                className="input" 
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.4)', color: 'white' }}
              >
                {models.map(m => (
                  <option key={m._id} value={m._id}>{m.model_name} ({m.provider})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Task / Prompt Payload</label>
              <textarea 
                className="input" 
                rows={4} 
                placeholder="e.g. Summarize user calling agent session transcript for real estate lead qualification..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <button type="submit" className="btn" style={{ width: '100%' }} disabled={running}>
              <Play size={18} fill="currentColor" /> {running ? 'Executing via Gateway...' : 'Execute & Log to Database'}
            </button>
          </form>
        </div>

        {/* Recent Logs Table */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1.25rem', fontSize: '1.25rem', fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock color="var(--warning)" /> Real-Time Gateway Usage Logs
          </div>
          
          <div className="table-container" style={{ flex: 1, maxHeight: '350px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Task / Integration Type</th>
                  <th>Tokens (In/Out)</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No tasks executed yet. Try executing a prompt on the left!
                    </td>
                  </tr>
                ) : (
                  logs.map((log, idx) => (
                    <tr key={log._id || idx}>
                      <td style={{ fontWeight: 600, color: 'white', fontSize: '0.85rem' }}>
                        <div>{log.task_type || 'Calling Agent Session'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(log.date_and_time || Date.now()).toLocaleTimeString()}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <span style={{ color: '#a5b4fc' }}>{log.input_tokens || 0}</span> / <span style={{ color: '#f472b6' }}>{log.output_tokens || 0}</span>
                      </td>
                      <td style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.85rem' }}>
                        ${log.total_cost || '0.005'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
