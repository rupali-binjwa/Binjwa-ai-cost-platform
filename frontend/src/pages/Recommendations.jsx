import React, { useState } from 'react';
import { Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';

function Recommendations() {
  const [taskDescription, setTaskDescription] = useState('');
  const [estimatedInput, setEstimatedInput] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState(null);

  const handlePredict = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Simulate API call to /recommendations/predict-cost
    setTimeout(() => {
      const inputChars = parseInt(estimatedInput) || 1000;
      const outputChars = parseInt(expectedOutput) || 500;
      
      const inputTokens = Math.ceil(inputChars / 4);
      const outputTokens = Math.ceil(outputChars / 4);
      const totalTokens = inputTokens + outputTokens;

      const mockResults = [
        {
          model_name: "Gemini 2.0 Flash",
          provider: "Google",
          predicted_total_tokens: totalTokens,
          predicted_cost: (totalTokens / 1000) * 0.001,
          is_recommended: true
        },
        {
          model_name: "Llama 3 8B",
          provider: "Groq",
          predicted_total_tokens: totalTokens,
          predicted_cost: (totalTokens / 1000) * 0.002,
          is_recommended: false
        },
        {
          model_name: "GPT-4o",
          provider: "OpenAI",
          predicted_total_tokens: totalTokens,
          predicted_cost: (totalTokens / 1000) * 0.015,
          is_recommended: false
        }
      ].sort((a, b) => a.predicted_cost - b.predicted_cost);

      setRecommendations(mockResults);
      setLoading(false);
    }, 1000);
  };

  return (
    <div>
      <h1 className="page-title">Predictive Cost Analysis</h1>
      <p className="page-subtitle">Estimate token usage and discover the most cost-effective AI model for your specific task.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="card">
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem' }}>Task Parameters</h2>
          <form onSubmit={handlePredict}>
            <div className="form-group">
              <label className="label">Task Description</label>
              <textarea 
                className="input" 
                rows="3" 
                placeholder="E.g., Summarize a 10-page document into key bullet points"
                value={taskDescription}
                onChange={e => setTaskDescription(e.target.value)}
                required
              ></textarea>
            </div>
            <div className="form-group">
              <label className="label">Estimated Input Characters</label>
              <input 
                type="number" 
                className="input" 
                placeholder="E.g., 20000"
                value={estimatedInput}
                onChange={e => setEstimatedInput(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label">Expected Output Characters</label>
              <input 
                type="number" 
                className="input" 
                placeholder="E.g., 1500"
                value={expectedOutput}
                onChange={e => setExpectedOutput(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn" style={{width: '100%'}} disabled={loading}>
              <Sparkles size={18} />
              {loading ? 'Analyzing...' : 'Generate Recommendations'}
            </button>
          </form>
        </div>

        <div>
          {recommendations && (
            <div>
              <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Model Recommendations</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {recommendations.map((rec, index) => (
                  <div key={index} className={`card ${rec.is_recommended ? 'recommended-card' : ''}`} style={{marginBottom: 0}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'}}>
                      <div>
                        <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem'}}>
                          <h3 style={{fontSize: '1.125rem', fontWeight: 600}}>{rec.model_name}</h3>
                          {rec.is_recommended && <span className="badge success" style={{display: 'flex', gap: '4px'}}><CheckCircle2 size={12}/> Best Value</span>}
                        </div>
                        <p style={{color: 'var(--text-muted)', fontSize: '0.875rem'}}>Provider: {rec.provider}</p>
                      </div>
                      <div style={{textAlign: 'right'}}>
                        <div style={{fontSize: '1.25rem', fontWeight: 700, color: rec.is_recommended ? 'var(--primary)' : 'inherit'}}>
                          {formatCurrency(rec.predicted_cost, 4)}
                        </div>
                        <div style={{fontSize: '0.875rem', color: 'var(--text-muted)'}}>
                          Est. {rec.predicted_total_tokens.toLocaleString()} tokens
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Recommendations;
