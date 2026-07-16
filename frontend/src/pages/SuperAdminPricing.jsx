import React, { useState, useEffect } from 'react';
import { superAdminAPI, clientAdminAPI, employeeAPI, modelsAPI, recommendationAPI } from '../services/api';
import { Building2, Users, Database, TrendingUp, CheckCircle, Code, ShieldCheck, Activity, Plus, RefreshCw, Terminal, PhoneCall, MessageSquare } from 'lucide-react';

export default function SuperAdminPricing() {
  const [organizations, setOrganizations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [models, setModels] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison' | 'telemetry' | 'integrations' | 'employees'
  
  // Multi-Plan & Multi-Modal Infrastructure Selection State
  const [selectedPlans, setSelectedPlans] = useState([
    'bulk_ivr', 'multi_level_ivr', 'press_1_transfer', 'call_recording', 'real_time_crm_reports',
    'whatsapp_auto_reply', 'whatsapp_team_dashboard', 'lead_tag_filter', 'broadcast_campaigns', 'admin_team_management',
    'ai_voice_calling_outbound', 'ai_inbound_handling', 'ai_meeting_booking', 'ai_call_transcript', 'auto_email_meeting', 'multilingual_support', 'male_female_voice'
  ]); // Default to PRO plan
  const [selectedBundleTier, setSelectedBundleTier] = useState('pro');
  const [monthlyInteractions, setMonthlyInteractions] = useState(5000); // Calls / Sessions per month
  const [avgDurationMinutes, setAvgDurationMinutes] = useState(3.5); // Average minutes per call
  const [whatsappMonthlyMessages, setWhatsappMonthlyMessages] = useState(15000); // WhatsApp messages per month
  const [whatsappAvgTurns, setWhatsappAvgTurns] = useState(6); // Turns per WhatsApp conversation
  const [crmMonthlyEvents, setCrmMonthlyEvents] = useState(8000); // CRM & Webhook events per month
  const [aiAutonomousSessions, setAiAutonomousSessions] = useState(3000); // AI autonomous sessions per month
  const [showPlanDropdown, setShowPlanDropdown] = useState(false);
  const [compInputTokens, setCompInputTokens] = useState(650);
  const [compOutputTokens, setCompOutputTokens] = useState(250);

  const [vendorData, setVendorData] = useState({
    llmModels: [],
    sttVendors: [],
    ttsVendors: [],
    telecomVendors: []
  });
  const [fetchingVendors, setFetchingVendors] = useState(false);

  const [selectedRecommendedModel, setSelectedRecommendedModel] = useState(null);

  // Modal for new employee
  const [showEmpModal, setShowEmpModal] = useState(false);
  const [empForm, setEmpForm] = useState({ name: '', email: '', phone: '', password: 'Password@123' });
  const [msg, setMsg] = useState({ type: '', text: '' });

  const storedOrgId = localStorage.getItem('organization_id');
  const storedUserId = localStorage.getItem('user_id');

  const planCatalog = [
    { id: 'bulk_ivr', name: 'Bulk IVR Calling', category: 'Telecom & IVR', stt: 0.0005, tts: 0.0005, telecom: 0.007, llm: 0.0001, costPerMinute: 0.0081, desc: 'High-concurrency outbound DTMF & voice broadcast via Vobiz Trunking.' },
    { id: 'multi_level_ivr', name: 'Multi-Level IVR Routing', category: 'Telecom & IVR', stt: 0.0005, tts: 0.0005, telecom: 0.007, llm: 0.0002, costPerMinute: 0.0082, desc: 'Smart intent-driven DTMF and natural language branch routing.' },
    { id: 'press_1_transfer', name: 'Press-1 Human Transfer', category: 'Telecom & IVR', stt: 0.0003, tts: 0.0003, telecom: 0.007, llm: 0.0001, costPerMinute: 0.0077, desc: 'Live warm-transfer and bridging to human sales/support agents.' },
    { id: 'call_recording', name: 'Call Recording', category: 'Telecom & IVR', stt: 0.0, tts: 0.0, telecom: 0.003, llm: 0.0, costPerMinute: 0.0030, desc: 'Encrypted multi-channel stereo WAV/MP3 recording on AWS S3.' },
    { id: 'real_time_crm_reports', name: 'Real-Time CRM Reports', category: 'Analytics & CRM', stt: 0.0, tts: 0.0, telecom: 0.001, llm: 0.0005, costPerMinute: 0.0015, desc: 'Live telemetry, lead conversion analytics, and webhook dashboards.' },
    { id: 'whatsapp_auto_reply', name: 'WhatsApp Auto-Reply', category: 'WhatsApp Messaging', stt: 0.0, tts: 0.0, telecom: 0.0045, llm: 0.0015, costPerMinute: 0.0060, desc: 'Instant multilingual auto-response using DeepSeek V3 / Llama 3.' },
    { id: 'whatsapp_team_dashboard', name: 'WhatsApp Team Dashboard', category: 'WhatsApp Messaging', stt: 0.0, tts: 0.0, telecom: 0.0015, llm: 0.0005, costPerMinute: 0.0020, desc: 'Multi-agent shared team inbox, assignment & SLA monitoring.' },
    { id: 'lead_tag_filter', name: 'Tag, Filter & Transfer Leads', category: 'Analytics & CRM', stt: 0.0, tts: 0.0, telecom: 0.001, llm: 0.0005, costPerMinute: 0.0015, desc: 'Automated intent tagging, hot lead filtering and routing.' },
    { id: 'broadcast_campaigns', name: 'Broadcast Campaigns (WhatsApp)', category: 'WhatsApp Messaging', stt: 0.0, tts: 0.0, telecom: 0.0045, llm: 0.0005, costPerMinute: 0.0050, desc: 'Bulk promotional and transactional templates via Meta Cloud API.' },
    { id: 'admin_team_management', name: 'Admin & Team Member Management', category: 'Analytics & CRM', stt: 0.0, tts: 0.0, telecom: 0.0005, llm: 0.0005, costPerMinute: 0.0010, desc: 'Role-based access controls (RBAC) and agent productivity scores.' },
    { id: 'ai_voice_calling_outbound', name: 'AI Voice Calling Agent (Outbound)', category: 'AI Voice Calling Bot', stt: 0.0043, tts: 0.0150, telecom: 0.007, llm: 0.0030, costPerMinute: 0.0293, desc: 'Autonomous human-like outbound conversational voice agent.' },
    { id: 'ai_inbound_handling', name: 'AI Inbound Call Handling (24/7)', category: 'AI Voice Calling Bot', stt: 0.0043, tts: 0.0150, telecom: 0.007, llm: 0.0030, costPerMinute: 0.0293, desc: 'Never miss a customer query with instant conversational answering.' },
    { id: 'ai_meeting_booking', name: 'AI Meeting Booking & Calendar Sync', category: 'Productivity & Sync', stt: 0.001, tts: 0.002, telecom: 0.002, llm: 0.0020, costPerMinute: 0.0070, desc: 'Real-time Google Calendar and Outlook slot check and booking.' },
    { id: 'ai_call_transcript', name: 'AI Call Transcript & Summary', category: 'Productivity & Sync', stt: 0.0043, tts: 0.0, telecom: 0.001, llm: 0.0015, costPerMinute: 0.0068, desc: 'Word-accurate transcription and bulleted action item extraction.' },
    { id: 'auto_email_meeting', name: 'Auto Email on Meeting Booked', category: 'Productivity & Sync', stt: 0.0, tts: 0.0, telecom: 0.001, llm: 0.0005, costPerMinute: 0.0015, desc: 'Instant calendar invite and confirmation email dispatch via SendGrid.' },
    { id: 'multilingual_support', name: 'Multilingual Voice Support', category: 'AI Voice Calling Bot', stt: 0.0043, tts: 0.0150, telecom: 0.007, llm: 0.0020, costPerMinute: 0.0283, desc: 'Fluid switching between English, Hindi, Hinglish, Spanish, etc.' },
    { id: 'male_female_voice', name: 'Male / Female / Neural Voice', category: 'AI Voice Calling Bot', stt: 0.0, tts: 0.0150, telecom: 0.002, llm: 0.0005, costPerMinute: 0.0175, desc: 'Choice of 50+ hyper-realistic ElevenLabs and Murf neural voices.' },
    { id: 'custom_voice_branding', name: 'Custom Voice Branding', category: 'Enterprise Custom', stt: 0.0, tts: 0.0180, telecom: 0.002, llm: 0.0010, costPerMinute: 0.0210, desc: 'Voice clone of your brand ambassador or CEO for all calls.' },
    { id: 'dedicated_account_manager', name: 'Dedicated Account Manager', category: 'Enterprise Custom', stt: 0.0, tts: 0.0, telecom: 0.005, llm: 0.0010, costPerMinute: 0.0060, desc: 'Direct Slack channel and 1-hour priority SLA assistance.' },
    { id: 'custom_api_crm_integration', name: 'Custom API & CRM Integration', category: 'Enterprise Custom', stt: 0.001, tts: 0.001, telecom: 0.003, llm: 0.0005, costPerMinute: 0.0055, desc: 'Direct webhook synchronization with HubSpot, Salesforce, Zoho, and custom ERPs.' }
  ];

  const bundleTiers = [
    {
      id: 'starter',
      name: 'STARTER (IVR Only)',
      badge: 'Tier 1 • 5 Capabilities',
      color: 'var(--primary)',
      description: 'Core outbound/inbound IVR routing, DTMF menu selection, human transfer, recording & CRM reports.',
      plans: ['bulk_ivr', 'multi_level_ivr', 'press_1_transfer', 'call_recording', 'real_time_crm_reports']
    },
    {
      id: 'essential',
      name: 'ESSENTIAL (IVR + WhatsApp)',
      badge: 'Tier 2 • 10 Capabilities',
      color: '#3b82f6',
      description: 'Everything in Starter plus WhatsApp auto-replies, multi-agent inbox, lead filtering & broadcast automation.',
      plans: ['bulk_ivr', 'multi_level_ivr', 'press_1_transfer', 'call_recording', 'real_time_crm_reports', 'whatsapp_auto_reply', 'whatsapp_team_dashboard', 'lead_tag_filter', 'broadcast_campaigns', 'admin_team_management']
    },
    {
      id: 'growth',
      name: 'GROWTH (IVR + AI Agent)',
      badge: 'Tier 3 • 12 Capabilities',
      color: '#8b5cf6',
      description: 'Starter IVR suite plus autonomous AI voice calling, 24/7 inbound AI, calendar booking, transcripts & neural voices.',
      plans: ['bulk_ivr', 'multi_level_ivr', 'press_1_transfer', 'call_recording', 'real_time_crm_reports', 'ai_voice_calling_outbound', 'ai_inbound_handling', 'ai_meeting_booking', 'ai_call_transcript', 'auto_email_meeting', 'multilingual_support', 'male_female_voice']
    },
    {
      id: 'pro',
      name: 'PRO (IVR + AI + WhatsApp)',
      badge: 'Tier 4 • 17 Capabilities',
      color: '#eab308',
      description: 'The complete enterprise powerhouse combining IVR, full AI Voice Agents, and complete WhatsApp Automation suite.',
      plans: ['bulk_ivr', 'multi_level_ivr', 'press_1_transfer', 'call_recording', 'real_time_crm_reports', 'whatsapp_auto_reply', 'whatsapp_team_dashboard', 'lead_tag_filter', 'broadcast_campaigns', 'admin_team_management', 'ai_voice_calling_outbound', 'ai_inbound_handling', 'ai_meeting_booking', 'ai_call_transcript', 'auto_email_meeting', 'multilingual_support', 'male_female_voice']
    },
    {
      id: 'enterprise',
      name: 'ENTERPRISE (Full Suite + Custom)',
      badge: 'Tier 5 • All 20 Capabilities',
      color: '#f43f5e',
      description: 'All 17 Pro features plus Custom Voice Branding, Dedicated Account Manager, and custom API/CRM integration.',
      plans: ['bulk_ivr', 'multi_level_ivr', 'press_1_transfer', 'call_recording', 'real_time_crm_reports', 'whatsapp_auto_reply', 'whatsapp_team_dashboard', 'lead_tag_filter', 'broadcast_campaigns', 'admin_team_management', 'ai_voice_calling_outbound', 'ai_inbound_handling', 'ai_meeting_booking', 'ai_call_transcript', 'auto_email_meeting', 'multilingual_support', 'male_female_voice', 'custom_voice_branding', 'dedicated_account_manager', 'custom_api_crm_integration']
    }
  ];

  const handleSelectBundleTier = (tierId) => {
    setSelectedBundleTier(tierId);
    if (tierId !== 'custom') {
      const tierObj = bundleTiers.find(b => b.id === tierId);
      if (tierObj && tierObj.plans) {
        setSelectedPlans([...tierObj.plans]);
      }
    }
  };

  const togglePlanSelection = (planId) => {
    setSelectedBundleTier('custom');
    if (selectedPlans.includes(planId)) {
      if (selectedPlans.length > 1) {
        setSelectedPlans(selectedPlans.filter(id => id !== planId));
      }
    } else {
      setSelectedPlans([...selectedPlans, planId]);
    }
  };

  

  
  useEffect(() => {
    const fetchVendorData = async () => {
      setFetchingVendors(true);
      try {
        const res = await recommendationAPI.evaluateVendors({
          monthly_interactions: monthlyInteractions,
          avg_duration_minutes: avgDurationMinutes,
          comp_input_tokens: compInputTokens,
          comp_output_tokens: compOutputTokens
        });
        setVendorData({
          llmModels: res.llm_models || [],
          sttVendors: res.stt_vendors || [],
          ttsVendors: res.tts_vendors || [],
          telecomVendors: res.telecom_vendors || []
        });
        
        // Auto-select the recommended model
        const recommended = (res.llm_models || []).find(m => m.is_top);
        if (recommended && selectedRecommendedModel !== recommended.name) {
          // If we want to auto-select, we can, but since user can override, we might just use the returned recommended model as default if it's the first load
        }
      } catch (err) {
        console.error("Failed to fetch vendor data:", err);
      } finally {
        setFetchingVendors(false);
      }
    };
    fetchVendorData();
  }, [monthlyInteractions, avgDurationMinutes, compInputTokens, compOutputTokens]);

  const fetchData = async () => {
    setLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const [orgsRes, empsRes, modelsRes] = await Promise.all([
        superAdminAPI.getOrganizations().catch(() => ([])),
        employeeAPI.getEmployees().catch(() => ({ employees: [] })),
        modelsAPI.getAllModels().catch(() => ({ models: [] }))
      ]);

      const orgList = Array.isArray(orgsRes) ? orgsRes : [];
      setOrganizations(orgList);
      
      const empList = empsRes && empsRes.employees ? empsRes.employees : [];
      setEmployees(empList);

      const modelList = modelsRes && modelsRes.models ? modelsRes.models : [];
      setModels(modelList);

      // Fetch Automated Telemetry & Cost Analysis
      const currentOrg = orgList.find(o => o._id === storedOrgId) || orgList[0];
      const orgIdToUse = currentOrg ? currentOrg._id : 'default';
      const telemRes = await recommendationAPI.autoAnalyze(orgIdToUse).catch(() => null);
      setTelemetry(telemRes);
    } catch (err) {
      console.error('Safe fallback warning:', err);
      setOrganizations([]);
      setEmployees([]);
      setModels([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    const currentOrg = organizations.find(o => o._id === storedOrgId) || organizations[0];
    if (!currentOrg) {
      setMsg({ type: 'error', text: 'No organization available to attach employee.' });
      return;
    }

    try {
      await employeeAPI.createEmployee({
        organization_id: currentOrg._id,
        client_admin_id: storedUserId || currentOrg._id,
        name: empForm.name,
        email: empForm.email,
        phone: empForm.phone,
        password: empForm.password
      });
      setMsg({ type: 'success', text: 'Employee added successfully to real DB!' });
      setShowEmpModal(false);
      setEmpForm({ name: '', email: '', phone: '', password: 'Password@123' });
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err.message || 'Error adding employee.' });
    }
  };

  const currentOrg = organizations.find(o => o._id === storedOrgId) || organizations[0] || {};
  const totalTokens = currentOrg.total_tokens || 5000000;
  const availableTokens = currentOrg.available_tokens || 3800000;
  const usedTokens = totalTokens - availableTokens;

  return (
    <div>
      <div className="flex-between mb-2">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge primary" style={{ fontSize: '0.8rem' }}>Client Admin Portal</span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{currentOrg.company_name || 'Acme Voice & Chatbot Corp'}</span>
          </div>
          <h1 className="page-title" style={{ marginTop: '4px' }}>AI Gateway & Telemetry Dashboard</h1>
          <p className="page-subtitle">Automated traffic analysis, token routing, and platform integrations</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={fetchData} title="Refresh Live Data">
            <RefreshCw size={18} />
          </button>
          <button className="btn" onClick={() => setShowEmpModal(true)}>
            <Plus size={18} /> Add Employee / Agent
          </button>
        </div>
      </div>

      {msg.text && (
        <div style={{
          padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: msg.type === 'success' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
          color: msg.type === 'success' ? '#6ee7b7' : '#fca5a5'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={20} /> {msg.text}
          </div>
          <button onClick={() => setMsg({ type: '', text: '' })} style={{ background: 'transparent', border: 'none', color: 'inherit', fontSize: '1.2rem', cursor: 'pointer', padding: '0 8px', fontWeight: 'bold' }}>
            ×
          </button>
        </div>
      )}

      {/* Top Stats */}
      <div className="dashboard-grid">
        <div className="card">
          <div className="card-title">
            <Database size={20} color="var(--primary)" /> Organization Token Pool
          </div>
          <div className="card-value">{totalTokens.toLocaleString()}</div>
          <div className="mt-2" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total contracted volume</div>
        </div>
        
        <div className="card">
          <div className="card-title">
            <Activity size={20} color="var(--accent)" /> Tokens Consumed by Agents
          </div>
          <div className="card-value">{usedTokens.toLocaleString()}</div>
          <div className="mt-2" style={{ color: 'var(--accent)', fontSize: '0.85rem' }}>
            {((usedTokens / (totalTokens || 1)) * 100).toFixed(1)}% of total balance consumed
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <Users size={20} color="var(--warning)" /> Active Employees & Bots
          </div>
          <div className="card-value">{employees.length || 1}</div>
          <div className="mt-2" style={{ color: 'var(--success)', fontSize: '0.85rem' }}>Connected via API & Webhooks</div>
        </div>
      </div>

      {/* Section Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${activeTab === 'comparison' ? '' : 'btn-secondary'}`}
          onClick={() => setActiveTab('comparison')}
          style={{ padding: '0.6rem 1.25rem' }}
        >
          <Activity size={18} /> LLM Model Comparison & Recommendations
        </button>

      </div>

      {/* Tab 0: LLM Model Comparison & Token Recommendation Engine */}
      {activeTab === 'comparison' && (
        <div>
          {/* Workload Simulator Banner */}
          <div className="card" style={{ 
            marginBottom: '2rem', 
            border: '1px solid var(--border-color)', 
            background: 'linear-gradient(135deg, var(--bg-surface), rgba(15, 23, 42, 0.03))',
            boxShadow: 'var(--shadow-md)'
          }}>
            <div className="flex-between mb-2">
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  Enterprise LLM Model Comparison & Token Calculator
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                  Select your application type or adjust token estimates below to compare real-time costs, latencies, and get our Gateway's AI Recommendation across 10 top models.
                </p>
              </div>
            </div>

            {/* Step 1: Enterprise Bundle Plan Selector (5 Tier Options from Catalog Matrix) */}
            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '1.5rem', background: 'linear-gradient(135deg, var(--bg-surface), rgba(15, 23, 42, 0.05))' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Step 1: Select Enterprise Infrastructure Plan / Bundle Tier
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Choose a pre-packaged tier (`STARTER`, `ESSENTIAL`, `GROWTH`, `PRO`, `ENTERPRISE`) to automatically select all included features in the secondary dropdown below.
                  </span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '1rem' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <select 
                    className="input" 
                    value={selectedBundleTier} 
                    onChange={(e) => handleSelectBundleTier(e.target.value)}
                    style={{ width: '100%', fontSize: '1.05rem', fontWeight: 700, padding: '0.75rem 1rem', background: 'var(--bg-surface)', color: 'var(--text-main)', border: '2px solid #f97316', borderRadius: '10px', cursor: 'pointer' }}
                  >
                    {bundleTiers.map(b => (
                      <option key={b.id} value={b.id} style={{ background: 'var(--bg-color)', color: 'var(--text-main)' }}>
                        {b.name} — {b.badge}
                      </option>
                    ))}
                    <option value="custom" style={{ background: 'var(--bg-color)', color: 'var(--warning)' }}>
                      CUSTOM BUNDLE — Hand-Picked ({selectedPlans.length} Capabilities Selected)
                    </option>
                  </select>
                </div>
              </div>

              {/* Interactive Tier Cards Grid for quick clicking */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px' }}>
                {bundleTiers.map(b => {
                  const isCurrent = selectedBundleTier === b.id;
                  return (
                    <div 
                      key={b.id}
                      onClick={() => handleSelectBundleTier(b.id)}
                      style={{
                        padding: '1rem',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: isCurrent ? 'rgba(249, 115, 22, 0.25)' : 'rgba(255,255,255,0.03)',
                        border: isCurrent ? `2px solid #f97316` : '1px solid rgba(255,255,255,0.08)',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      {isCurrent && (
                        <div style={{ position: 'absolute', top: '-10px', right: '10px', background: b.color, color: 'var(--text-main)', fontSize: '0.65rem', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                          ✓ ACTIVE TIER
                        </div>
                      )}
                      <div style={{ fontWeight: 800, color: isCurrent ? 'var(--accent)' : b.color, fontSize: '0.95rem', marginBottom: '4px' }}>
                        {b.name.split(' ')[0]} {b.name.split(' ')[1]}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '6px' }}>
                        {b.badge.split(' • ')[1]}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        {b.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Interactive Multi-Select Dropdown & Checkbox Selector for all 20 Individual Capabilities */}
            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    Step 2: Customize / Fine-Tune Capabilities in Selected Plan <span className="badge primary" style={{ fontSize: '0.75rem' }}>{selectedPlans.length} / 20 Selected</span>
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Hand-pick or adjust any of the 20 individual capabilities below to fine-tune your selected infrastructure bundle.
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button 
                    className="btn btn-primary" 
                    onClick={() => setShowPlanDropdown(!showPlanDropdown)}
                    style={{ fontSize: '0.82rem', padding: '0.45rem 1rem' }}
                  >
                    {showPlanDropdown ? '▲ Close Dropdown Menu' : '▼ Open Complete 20-Option Dropdown Menu'}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setSelectedPlans(planCatalog.map(p => p.id))}
                    style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem' }}
                  >
                    Select All 20
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => setSelectedPlans(['bulk_ivr', 'multi_level_ivr', 'ai_voice_calling_outbound', 'ai_call_transcript', 'whatsapp_auto_reply'])}
                    style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem' }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Collapsible Dropdown Checkbox Grid with all 20 Individual Options */}
              {showPlanDropdown && (
                <div style={{ background: 'var(--bg-color)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--primary)', marginBottom: '1.25rem', maxHeight: '420px', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Check / Uncheck Individual Capabilities (`Exact 20 from PDF`):</span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }} onClick={() => setSelectedPlans(planCatalog.filter(p => p.category.includes('Voice')).map(p => p.id))}>Voice Only</button>
                      <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }} onClick={() => setSelectedPlans(planCatalog.filter(p => p.category.includes('WhatsApp')).map(p => p.id))}>WhatsApp Only</button>
                      <button className="btn btn-secondary" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }} onClick={() => setSelectedPlans(planCatalog.filter(p => p.category.includes('Telecom')).map(p => p.id))}>IVR Only</button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '10px' }}>
                    {planCatalog.map(plan => {
                      const isSelected = selectedPlans.includes(plan.id);
                      return (
                        <div 
                          key={plan.id}
                          onClick={() => togglePlanSelection(plan.id)}
                          style={{ 
                            padding: '0.65rem 0.9rem', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            background: isSelected ? 'rgba(249, 115, 22, 0.08)' : 'var(--bg-surface)',
                            border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isSelected} 
                            onChange={() => {}} 
                            style={{ accentColor: 'var(--primary)', width: '16px', height: '16px', cursor: 'pointer', flexShrink: 0 }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--accent)' : 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {plan.name}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: isSelected ? '#fdba74' : 'var(--text-muted)' }}>
                              {plan.category} • ${plan.costPerMinute.toFixed(4)}/min
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Selected Pills Summary */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '1.25rem', maxHeight: showPlanDropdown ? '100px' : 'none', overflowY: 'auto' }}>
                {planCatalog.filter(p => selectedPlans.includes(p.id)).map(plan => (
                  <div 
                    key={plan.id}
                    onClick={() => togglePlanSelection(plan.id)}
                    style={{ 
                      padding: '0.4rem 0.85rem', 
                      borderRadius: '20px', 
                      background: 'rgba(15, 23, 42, 0.03)', 
                      border: '1px solid #f97316', 
                      color: 'var(--text-main)', 
                      fontSize: '0.8rem', 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>{plan.name}</span>
                    <span style={{ color: 'var(--danger)', fontWeight: 800 }}>×</span>
                  </div>
                ))}
              </div>

              {/* Dynamic Workload & Volume Sliders (Auto-Adapting to Selected Capabilities) */}
              {(() => {
                const activePlans = planCatalog.filter(p => selectedPlans.includes(p.id));
                const showCallingSliders = activePlans.some(p => p.category.includes('Telecom') || p.category.includes('Voice') || p.id.includes('ivr') || p.id.includes('press_1') || p.id.includes('recording'));
                const showWhatsappSliders = activePlans.some(p => p.category.includes('WhatsApp'));
                const showCrmSliders = activePlans.some(p => p.category.includes('Analytics') || p.id.includes('crm') || p.id.includes('lead') || p.id.includes('admin'));
                const showAiSliders = activePlans.some(p => p.category.includes('AI Voice Calling Bot') || p.category.includes('Productivity') || p.id.includes('ai_'));

                return (
                  <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--warning)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      ⚡ Multi-Modal Workload & Volume Customization Sliders (Adapts to Your Selected Plan):
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                      {/* 1. Calling & IVR Sliders */}
                      {showCallingSliders && (
                        <>
                          <div style={{ background: 'rgba(15, 23, 42, 0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                            <label className="label" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)', fontWeight: 600, marginBottom: '6px' }}>
                              <span>Monthly Telecom / IVR Call Sessions:</span>
                              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{monthlyInteractions.toLocaleString()} Sessions</span>
                            </label>
                            <input 
                              type="range" min="500" max="50000" step="500"
                              value={monthlyInteractions} onChange={e => setMonthlyInteractions(Number(e.target.value))}
                              style={{ width: '100%', accentColor: 'var(--primary)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              <span>500 (Startup IVR)</span>
                              <span>50,000 (Bulk Calling)</span>
                            </div>
                          </div>

                          <div style={{ background: 'rgba(15, 23, 42, 0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                            <label className="label" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', fontWeight: 600, marginBottom: '6px' }}>
                              <span>⏱️ Average Call / Session Duration:</span>
                              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{avgDurationMinutes.toFixed(1)} Minutes</span>
                            </label>
                            <input 
                              type="range" min="1.0" max="10.0" step="0.5"
                              value={avgDurationMinutes} onChange={e => setAvgDurationMinutes(Number(e.target.value))}
                              style={{ width: '100%', accentColor: 'var(--text-main)' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              <span>1.0 Min (Quick IVR Menu)</span>
                              <span>10.0 Mins (Deep Discussion)</span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* 2. WhatsApp Sliders */}
                      {showWhatsappSliders && (
                        <>
                          <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                            <label className="label" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: 600, marginBottom: '6px' }}>
                              <span>Monthly WhatsApp Messages / Alerts:</span>
                              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{whatsappMonthlyMessages.toLocaleString()} Messages</span>
                            </label>
                            <input 
                              type="range" min="1000" max="150000" step="1000"
                              value={whatsappMonthlyMessages} onChange={e => setWhatsappMonthlyMessages(Number(e.target.value))}
                              style={{ width: '100%', accentColor: '#10b981' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              <span>1,000 (Startup Auto-Reply)</span>
                              <span>150,000 (Broadcast Enterprise)</span>
                            </div>
                          </div>

                          <div style={{ background: 'rgba(16, 185, 129, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                            <label className="label" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: 600, marginBottom: '6px' }}>
                              <span>🔄 Avg Turns / Messages per WhatsApp Chat:</span>
                              <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{whatsappAvgTurns} Turns</span>
                            </label>
                            <input 
                              type="range" min="2" max="20" step="1"
                              value={whatsappAvgTurns} onChange={e => setWhatsappAvgTurns(Number(e.target.value))}
                              style={{ width: '100%', accentColor: '#10b981' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              <span>2 Turns (Quick Alert/Reply)</span>
                              <span>20 Turns (Full Support AI)</span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* 3. CRM & Webhooks Slider */}
                      {showCrmSliders && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.05)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                          <label className="label" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--warning)', fontWeight: 600, marginBottom: '6px' }}>
                            <span>Monthly CRM Reports & Lead Routing Triggers:</span>
                            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{crmMonthlyEvents.toLocaleString()} Events</span>
                          </label>
                          <input 
                            type="range" min="1000" max="100000" step="1000"
                            value={crmMonthlyEvents} onChange={e => setCrmMonthlyEvents(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#f59e0b' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            <span>1,000 (Lead Filter)</span>
                            <span>100,000 (Live Webhooks)</span>
                          </div>
                        </div>
                      )}

                      {/* 4. AI Autonomous Voice & Meeting Booking Slider */}
                      {showAiSliders && (
                        <div style={{ background: 'rgba(15, 23, 42, 0.03)', padding: '1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                          <label className="label" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--primary)', fontWeight: 600, marginBottom: '6px' }}>
                            <span>Autonomous AI Voice & Meeting Sessions:</span>
                            <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{aiAutonomousSessions.toLocaleString()} AI Sessions</span>
                          </label>
                          <input 
                            type="range" min="500" max="30000" step="500"
                            value={aiAutonomousSessions} onChange={e => setAiAutonomousSessions(Number(e.target.value))}
                            style={{ width: '100%', accentColor: '#ec4899' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            <span>500 (Bot Pilot)</span>
                            <span>30,000 (Full 24/7 AI Agent)</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Aggregated Multi-Capability Infrastructure & Vendor Pricing Engine */}
          {(() => {
            const activePlans = planCatalog.filter(p => selectedPlans.includes(p.id));

            const topLLM = (vendorData.llmModels || []).find(m => selectedRecommendedModel ? m.name === selectedRecommendedModel : m.is_top) || { name: 'Groq Llama-3', single_cost: 0.0015, bulk_cost: 0 };
            const topSTT = (vendorData.sttVendors || []).find(v => v.is_top) || { name: 'Deepgram Nova-2', rate: 0.0043 };
            const topTTS = (vendorData.ttsVendors || []).find(v => v.is_top) || { name: 'Cartesia AI', rate: 0.0150 };
            const topTelecom = (vendorData.telecomVendors || []).find(v => v.is_top) || { name: 'Vobiz Trunking', rate: 0.0070 };

            if (activePlans.length === 0) {
              return (
                <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', marginBottom: '2rem' }}>
                  Please select at least one capability from the 20-option dropdown menu above.
                </div>
              );
            }

            // Real-world multimodal vendor component rates based on active capabilities
            const hasVoice = activePlans.some(p => p.category.includes('Voice') || p.id.includes('voice') || p.id.includes('press_1') || p.id.includes('recording'));
            const hasNeuralVoice = activePlans.some(p => p.id.includes('ai_voice') || p.id.includes('inbound') || p.id.includes('neural') || p.id.includes('custom_voice'));
            const hasTelecom = activePlans.some(p => p.category.includes('Telecom') || p.category.includes('Voice') || p.id.includes('ivr'));
            const hasWhatsApp = activePlans.some(p => p.category.includes('WhatsApp'));
            const hasCrm = activePlans.some(p => p.category.includes('Analytics') || p.id.includes('crm') || p.id.includes('lead') || p.id.includes('admin'));
            const hasAiVoice = activePlans.some(p => p.category.includes('AI Voice Calling Bot') || p.category.includes('Productivity') || p.id.includes('ai_'));

            const sttRate = hasVoice || hasAiVoice ? topSTT.rate : (hasTelecom ? 0.0018 : 0); // Deepgram Nova-2 ($0.0043/min)
            const ttsRate = hasNeuralVoice || hasAiVoice ? topTTS.rate : (hasVoice ? 0.0060 : 0); // ElevenLabs Turbo / Murf ($0.0150/min)
            const telecomRate = hasTelecom || hasVoice || hasAiVoice ? topTelecom.rate : 0; // Vobiz Trunking ($0.0070/min)
            const whatsappRate = hasWhatsApp ? 0.0045 : 0; // Meta Cloud API equivalent rate
            
            // Itemized volume totals across active sliders
            const callingMinutes = (hasTelecom || hasVoice ? monthlyInteractions * avgDurationMinutes : 0) + (hasAiVoice ? aiAutonomousSessions * avgDurationMinutes : 0);
            const sttTotal = callingMinutes * sttRate;
            const ttsTotal = callingMinutes * ttsRate;
            const telecomTotal = callingMinutes * telecomRate;
            const whatsappTotal = hasWhatsApp ? whatsappMonthlyMessages * whatsappRate : 0; // Meta charges per conversation window
            const crmTotal = hasCrm ? crmMonthlyEvents * 0.0015 : 0;

            // Capped unified LLM Gateway intelligence rate across active options
            // WhatsApp LLM cost = Conversations (whatsappMonthlyMessages) * Turns per Chat * 0.0015 per turn
            const singleLlmCost = topLLM.single_cost || 0.0015;
            const llmTotal = (hasAiVoice ? aiAutonomousSessions * avgDurationMinutes * singleLlmCost * 2 : 0) + 
                             (hasWhatsApp ? whatsappMonthlyMessages * whatsappAvgTurns * singleLlmCost : 0) + 
                             (hasCrm ? crmMonthlyEvents * singleLlmCost : 0) + 
                             (hasTelecom ? monthlyInteractions * singleLlmCost : 0);

            const totalUnitRate = sttRate + ttsRate + telecomRate + whatsappRate + (hasCrm ? 0.0015 : 0) + 0.0030;
            const monthlyTotal = sttTotal + ttsTotal + telecomTotal + whatsappTotal + crmTotal + llmTotal;

            // Competitor Agency Wrapper Rate (Legacy agencies charge per-seat or $0.09-$0.14/min + double token markup)
            const competitorMonthlyTotal = Math.max(monthlyTotal * 3.4, callingMinutes * 0.085 + (whatsappMonthlyMessages * whatsappAvgTurns * 0.012) + (crmMonthlyEvents * 0.005));
            const savingsPercent = Math.round(((competitorMonthlyTotal - monthlyTotal) / (competitorMonthlyTotal || 1)) * 100);

            return (
              <div style={{ 
                background: 'linear-gradient(135deg, var(--bg-surface), rgba(249, 115, 22, 0.08))', 
                border: '1px solid var(--border-color)', 
                borderRadius: '16px', 
                padding: '1.75rem', 
                marginBottom: '2rem',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem', alignItems: 'center' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                      <CheckCircle size={18} /> Direct Vendor Infrastructure Pricing Engine (`Zero Agency Markup`)
                    </div>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 10px 0' }}>
                      {activePlans.length} / 20 Capabilities Activated
                    </h3>
                    <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
                      By utilizing our Gateway directly with **{topLLM.name}**, **{topTTS.name}**, **{topSTT.name}**, and **{topTelecom.name}**, your selected capabilities are auto-optimized for sub-300ms acoustic SLA without double-charging wrapper fees.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '1.25rem' }}>
                      {(hasVoice || hasTelecom || hasAiVoice) && (
                        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{topSTT.name} (Speech-to-Text)</div>
                          <div style={{ color: 'var(--success)', fontWeight: 700 }}>~${sttTotal.toFixed(2)} / mo</div>
                        </div>
                      )}
                      {(hasNeuralVoice || hasVoice || hasAiVoice) && (
                        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{topTTS.name} (Voice)</div>
                          <div style={{ color: 'var(--primary)', fontWeight: 700 }}>~${ttsTotal.toFixed(2)} / mo</div>
                        </div>
                      )}
                      {(hasTelecom || hasVoice || hasAiVoice) && (
                        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{topTelecom.name} & Telecom</div>
                          <div style={{ color: 'var(--text-muted)', fontWeight: 700 }}>~${telecomTotal.toFixed(2)} / mo</div>
                        </div>
                      )}
                      {hasWhatsApp && (
                        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Meta / WhatsApp Cloud API</div>
                          <div style={{ color: 'var(--success)', fontWeight: 700 }}>~${whatsappTotal.toFixed(2)} / mo</div>
                        </div>
                      )}
                      {hasCrm && (
                        <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>CRM Reports & Webhook Events</div>
                          <div style={{ color: 'var(--warning)', fontWeight: 700 }}>~${crmTotal.toFixed(2)} / mo</div>
                        </div>
                      )}
                      <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>LLM Intelligence ({topLLM.name})</div>
                        <div style={{ color: 'var(--warning)', fontWeight: 700 }}>~${llmTotal.toFixed(2)} / mo</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Total Combined Monthly Infrastructure Cost</div>
                    <div style={{ fontSize: '2.8rem', fontWeight: 800, color: 'var(--success)', margin: '6px 0' }}>
                      ${monthlyTotal.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                      Effective rate across {activePlans.length} features: <strong style={{ color: 'var(--text-main)' }}>${totalUnitRate.toFixed(4)} / min</strong>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px dashed rgba(239, 68, 68, 0.3)', padding: '0.75rem', borderRadius: '8px', marginBottom: '14px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Competitor Agency Wrappers (Legacy Rate)</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--danger)', textDecoration: 'line-through' }}>
                        ${competitorMonthlyTotal.toFixed(2)} / mo
                      </div>
                    </div>
                    <span className="badge success" style={{ display: 'inline-block', fontSize: '0.9rem', padding: '0.5rem 1.25rem', fontWeight: 800 }}>
                      You Save {savingsPercent}% (${(competitorMonthlyTotal - monthlyTotal).toFixed(2)}) with Binjwa
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Dynamic Multi-Vendor Comparison Grids (Self-Adapting to Selected Capabilities) */}
          {(() => {
            const activePlans = planCatalog.filter(p => selectedPlans.includes(p.id));
            const hasVoice = activePlans.some(p => p.category.includes('Voice') || p.id.includes('voice') || p.id.includes('press_1') || p.id.includes('recording'));
            const hasNeuralVoice = activePlans.some(p => p.id.includes('ai_voice') || p.id.includes('inbound') || p.id.includes('neural') || p.id.includes('custom_voice'));
            const hasTelecom = activePlans.some(p => p.category.includes('Telecom') || p.category.includes('Voice') || p.id.includes('ivr'));
            const hasWhatsApp = activePlans.some(p => p.category.includes('WhatsApp'));

            const sttVendors = vendorData.sttVendors;

            const ttsVendors = vendorData.ttsVendors;

            const telecomVendors = vendorData.telecomVendors;

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {/* Dynamic STT Comparison Grid (When Voice/Speech/IVR is selected) */}
                {(hasVoice || hasTelecom) && (
                  <div className="card">
                    <div className="flex-between mb-2">
                      <div>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                          Speech-to-Text (STT) Acoustic Vendor Comparison Grid (`Activated for Voice/IVR Suite`)
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                          Comparative real-time streaming SLA and per-minute vendor rates across top acoustic speech engines.
                        </p>
                      </div>
                    </div>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>STT Engine & Provider</th>
                            <th>Streaming Acoustic Latency</th>
                            <th>Recognition Accuracy & Specialty</th>
                            <th>Direct Rate (per min)</th>
                            <th>Cost for {monthlyInteractions.toLocaleString()} Sessions</th>
                            <th>Gateway Recommendation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sttVendors.map(v => (
                            <tr key={v.name} style={{ background: v.is_top ? 'rgba(15, 23, 42, 0.03)' : 'transparent', borderLeft: v.is_top ? '3px solid var(--primary)' : 'none' }}>
                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{v.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.provider}</div>
                              </td>
                              <td style={{ color: v.latency < 250 ? 'var(--success)' : '#fca5a5', fontWeight: 700 }}>{v.latency} ms</td>
                              <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{v.accuracy}</td>
                              <td style={{ fontWeight: 600, color: 'var(--warning)' }}>${v.rate.toFixed(4)} / min</td>
                              <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>${v.monthly_cost.toFixed(2)} / mo</td>
                              <td>
                                {v.is_top ? (
                                  <span className="badge primary" style={{ fontWeight: 700 }}>#1 Auto-Routed</span>
                                ) : (
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Alternative</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* 🔊 Dynamic TTS Comparison Grid (When Neural Voice / Voice Agents selected) */}
                {(hasNeuralVoice || hasVoice) && (
                  <div className="card">
                    <div className="flex-between mb-2">
                      <div>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                          🔊 Neural Text-to-Speech (TTS) Voice Generator Matrix (`Activated for AI Voice Personas`)
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                          Direct infrastructure rates and vocal expression benchmarking without agency wrapper markups.
                        </p>
                      </div>
                    </div>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>TTS Neural Engine & Provider</th>
                            <th>Synthesis Speed (TTFB)</th>
                            <th>Vocal Quality & Inflection Capability</th>
                            <th>Direct Rate (per min)</th>
                            <th>Cost for {monthlyInteractions.toLocaleString()} Sessions</th>
                            <th>Gateway Recommendation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ttsVendors.map(v => (
                            <tr key={v.name} style={{ background: v.is_top ? 'rgba(15, 23, 42, 0.03)' : 'transparent', borderLeft: v.is_top ? '3px solid var(--primary)' : 'none' }}>
                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{v.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.provider}</div>
                              </td>
                              <td style={{ color: v.latency < 200 ? 'var(--success)' : '#fdba74', fontWeight: 700 }}>{v.latency} ms</td>
                              <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{v.quality}</td>
                              <td style={{ fontWeight: 600, color: 'var(--warning)' }}>${v.rate.toFixed(4)} / min</td>
                              <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>${v.monthly_cost.toFixed(2)} / mo</td>
                              <td>
                                {v.is_top ? (
                                  <span className="badge primary" style={{ fontWeight: 700 }}>#1 Auto-Routed</span>
                                ) : (
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{v.badge || 'Alternative'}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Dynamic SIP Trunking Comparison Grid (When Telecom/IVR selected) */}
                {(hasTelecom || hasVoice) && (
                  <div className="card">
                    <div className="flex-between mb-2">
                      <div>
                        <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                          Telephony & SIP Trunking Carrier Comparison (`Activated for Telecom & IVR Routing`)
                        </h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                          Direct carrier SIP bridge SLA comparison versus legacy high-markup agency wrappers.
                        </p>
                      </div>
                    </div>
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Carrier Telephony & Provider</th>
                            <th>Uptime & SLA Guarantee</th>
                            <th>Direct Rate (per min)</th>
                            <th>Monthly Cost for {monthlyInteractions.toLocaleString()} Sessions</th>
                            <th>Status & Agency Markup</th>
                          </tr>
                        </thead>
                        <tbody>
                          {telecomVendors.map(v => (
                            <tr key={v.name} style={{ background: v.is_top ? 'rgba(15, 23, 42, 0.03)' : 'transparent', borderLeft: v.is_top ? '3px solid var(--primary)' : 'none' }}>
                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{v.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.provider}</div>
                              </td>
                              <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{v.uptime}</td>
                              <td style={{ fontWeight: 600, color: v.rate > 0.02 ? '#f87171' : '#fdba74' }}>${v.rate.toFixed(4)} / min</td>
                              <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>${v.monthly_cost.toFixed(2)} / mo</td>
                              <td>
                                {v.is_top ? (
                                  <span className="badge primary" style={{ fontWeight: 700 }}>Tier-1 Gateway Trunk</span>
                                ) : (
                                  <span style={{ fontSize: '0.78rem', color: v.rate > 0.02 ? '#fca5a5' : 'var(--text-muted)' }}>{v.badge || 'Alternative Carrier'}</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Underlying LLM Intelligence & Token Router Comparison Grid */}
                <div className="card">
                  <div className="flex-between mb-2">
                    <div>
                      <h3 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                        Underlying LLM Intelligence & Token Router Comparison Matrix
                      </h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '4px 0 0 0' }}>
                        Dynamically scaled across your **{monthlyInteractions.toLocaleString()} interactions** for sub-millisecond intent routing and conversation intelligence.
                      </p>
                    </div>
                  </div>

                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>LLM Model & Provider</th>
                          <th>Key Strength / Specialty</th>
                          <th>Context Window</th>
                          <th>Input Cost (per 1k)</th>
                          <th>Output Cost (per 1k)</th>
                          <th>Cost per Interaction</th>
                          <th>Monthly Volume Cost ({monthlyInteractions.toLocaleString()} Tasks)</th>
                          <th>Avg Speed</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(vendorData.llmModels || []).map(m => {
                          const singleCost = m.single_cost;
                          const bulkCost = m.bulk_cost;
                          // If user explicitly selected a model via 'Evaluate' button, use that, otherwise use backend recommendation
                          const isTop = selectedRecommendedModel ? (m.name === selectedRecommendedModel) : m.is_top;

                          return (
                            <tr key={m.id} style={{ background: isTop ? 'rgba(16, 185, 129, 0.08)' : 'transparent', borderLeft: isTop ? '3px solid var(--success)' : 'none' }}>
                              <td>
                                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.02rem' }}>{m.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{m.provider}</div>
                                {m.badge && (
                                  <span style={{ display: 'inline-block', marginTop: '4px', fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.18)', color: 'var(--text-main)', padding: '2px 6px', borderRadius: '4px' }}>
                                    {m.badge}
                                  </span>
                                )}
                              </td>
                              <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '220px' }}>{m.strength}</td>
                              <td style={{ fontWeight: 600, color: 'var(--warning)' }}>{m.context}</td>
                              <td style={{ color: 'var(--text-muted)' }}>${m.input_cost.toFixed(5)}</td>
                              <td style={{ color: 'var(--text-muted)' }}>${m.output_cost.toFixed(5)}</td>
                              <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>${singleCost.toFixed(4)}</td>
                              <td style={{ fontWeight: 800, color: isTop ? 'var(--success)' : 'var(--accent)', fontSize: '1.05rem' }}>
                                ${bulkCost.toFixed(2)} / mo
                              </td>
                              <td>
                                <span style={{ color: m.latency < 260 ? 'var(--success)' : m.latency < 400 ? '#fde047' : '#fca5a5', fontWeight: 700 }}>
                                  {m.latency} ms
                                </span>
                              </td>
                              <td>
                                {isTop ? (
                                  <span className="badge success" style={{ padding: '0.4rem 0.8rem', fontWeight: 700 }}>
                                    #1 Recommended
                                  </span>
                                ) : (
                                  <button 
                                    className="btn btn-secondary" 
                                    onClick={() => setSelectedRecommendedModel(m.name)}
                                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                                  >
                                    Evaluate
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Tab 1: Automated Telemetry & Smart Router */}
      {activeTab === 'telemetry' && (
        <div>
          <div className="card" style={{ marginBottom: '2rem', border: '1px solid var(--border-color)', background: 'linear-gradient(135deg, rgba(30, 33, 48, 0.9), rgba(249, 115, 22, 0.12))' }}>
            <div className="flex-between">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '6px' }}>
                  AI Gateway Automated Traffic Analyzer
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '800px' }}>
                  No manual task descriptions required! Our gateway automatically intercepts your live API traffic from voice calling bots, chatbots, and employee workflows to compute real-time cost optimizations.
                </p>
              </div>
              <div style={{ textAlign: 'right', background: 'rgba(16, 185, 129, 0.05)', padding: '1rem 1.5rem', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>Estimated Cost Reduction</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--success)' }}>
                  {telemetry ? `${telemetry.potential_savings_percent}%` : '65%'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by enabling Smart Model Router</div>
              </div>
            </div>

            {/* Live Telemetry Cards */}
            {telemetry && telemetry.traffic_breakdown && (
              <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
                {telemetry.traffic_breakdown.map((item, idx) => (
                  <div key={idx} style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {item.integration_type.toLowerCase().includes('voice') ? (
                          <div style={{ padding: '10px', background: 'rgba(15, 23, 42, 0.03)', color: 'var(--primary)', borderRadius: '10px' }}><PhoneCall size={20} /></div>
                        ) : (
                          <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.18)', color: 'var(--text-main)', borderRadius: '10px' }}><MessageSquare size={20} /></div>
                        )}
                        <div>
                          <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700 }}>{item.integration_type}</h4>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Avg Tokens: {item.avg_input_tokens} in / {item.avg_output_tokens} out</span>
                        </div>
                      </div>
                      <span className="badge success" style={{ fontSize: '0.75rem' }}>Auto-Detected</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.03)', padding: '1rem', borderRadius: '10px', marginBottom: '1rem' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Model Used</div>
                        <div style={{ fontWeight: 600, color: 'var(--danger)' }}>{item.current_model}</div>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>➔</div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gateway Recommended Model</div>
                        <div style={{ fontWeight: 700, color: 'var(--success)' }}>{item.recommended_model}</div>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: 0 }}>
                      <strong style={{ color: 'var(--text-main)' }}>Analysis:</strong> {item.reason}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Platform Integrations */}
      {activeTab === 'integrations' && (
        <div className="card">
          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal color="var(--primary)" /> API Gateway & SDK Integration Instructions
          </h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
            Connect your existing external applications (Voice Calling Agents, LangChain Chatbots, WhatsApp Bots) directly to our Gateway. All prompts are automatically tracked and optimized.
          </p>

          <div style={{ marginBottom: '2rem' }}>
            <label className="label" style={{ color: 'var(--text-main)', fontWeight: 600 }}>Your Organization Gateway API Key</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input 
                type="text" className="input" readOnly 
                value={`bj_live_gateway_${currentOrg._id || '9a8b7c6d5e4f3a2b'}_secret`} 
                style={{ fontFamily: 'monospace', background: 'var(--bg-surface)', color: 'var(--warning)' }}
              />
              <button className="btn" onClick={() => alert('API Key copied to clipboard!')}>Copy Key</button>
            </div>
          </div>

          <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>1. Python / LangChain / OpenAI SDK Drop-in Replacement</h4>
          <pre style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-muted)', overflowX: 'auto', fontSize: '0.9rem', marginBottom: '2rem', fontFamily: 'monospace' }}>
{`from openai import OpenAI

# Simply change the base_url to Binjwa Gateway and pass your API Key!
client = OpenAI(
    base_url="http://localhost:8000/gateway/v1",
    api_key="bj_live_gateway_secret_key"
)

response = client.chat.completions.create(
    model="auto-smart-router", # Or specify exact model e.g. "claude-3-haiku"
    messages=[{"role": "user", "content": "Handle customer calling support inquiry..."}]
)
print(response.choices[0].message.content)`}
          </pre>

          <h4 style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>2. Node.js / ElevenLabs Voice AI Agent Webhook</h4>
          <pre style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)', color: 'var(--text-muted)', overflowX: 'auto', fontSize: '0.9rem', fontFamily: 'monospace' }}>
{`// Configure your Voice Calling Bot (ElevenLabs / Vobiz / Vapi) to route through Binjwa
const response = await fetch("http://localhost:8000/gateway/v1/voice/completion", {
  method: "POST",
  headers: {
    "Authorization": "Bearer bj_live_gateway_secret_key",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    agent_id: "calling_bot_01",
    transcript: "Hello, I want to inquire about my real estate property status.",
    optimize_for_latency: true
  })
});`}
          </pre>
        </div>
      )}

      {/* Tab 3: Employees */}
      {activeTab === 'employees' && (
        <div>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee / Agent Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                      No employees or agent accounts found. Click "Add Employee / Agent" above.
                    </td>
                  </tr>
                ) : (
                  employees.map(emp => (
                    <tr key={emp._id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{emp.name}</td>
                      <td style={{ color: 'var(--text-muted)' }}>{emp.email}</td>
                      <td>{emp.phone}</td>
                      <td><span className="badge primary">{emp.role.toUpperCase()}</span></td>
                      <td><span className="badge success">Active</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for Adding Employee */}
      {showEmpModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--bg-surface)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Create Employee / Agent Account</h3>
            <form onSubmit={handleAddEmployee}>
              <div className="form-group">
                <label className="label">Full Name or Agent Name</label>
                <input 
                  type="text" className="input" required placeholder="e.g. Rahul Sharma or Voice Bot #1"
                  value={empForm.name} onChange={e => setEmpForm({...empForm, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="label">Email Address</label>
                <input 
                  type="email" className="input" required placeholder="employee@company.com"
                  value={empForm.email} onChange={e => setEmpForm({...empForm, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="label">Phone Number</label>
                <input 
                  type="text" className="input" required placeholder="+91 9876543210"
                  value={empForm.phone} onChange={e => setEmpForm({...empForm, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="label">Default Password</label>
                <input 
                  type="text" className="input" required
                  value={empForm.password} onChange={e => setEmpForm({...empForm, password: e.target.value})}
                />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowEmpModal(false)}>Cancel</button>
                <button type="submit" className="btn" style={{ flex: 1 }}>Save Account</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
