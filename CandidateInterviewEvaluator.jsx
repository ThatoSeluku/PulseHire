import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CandidateEvaluator() {
  // State management
  const [currentScreen, setCurrentScreen] = useState('candidate');
  const [candidate, setCandidate] = useState(null);
  const [alert, setAlert] = useState({ show: false, message: '', type: 'info' });
  const [weights, setWeights] = useState({ psychometric: 20, technical: 40, final: 40 });
  const [stages, setStages] = useState({
    psychometric: {
      completed: false,
      scores: {},
      comments: {},
      average: null,
      criteria: [
        { id: 'communication', label: 'Communication Skills' },
        { id: 'problemSolving', label: 'Problem Solving' },
        { id: 'teamwork', label: 'Teamwork & Collaboration' },
        { id: 'adaptability', label: 'Adaptability' },
        { id: 'motivation', label: 'Motivation & Drive' }
      ]
    },
    technical: {
      completed: false,
      scores: {},
      comments: {},
      average: null,
      criteria: [
        { id: 'technicalKnowledge', label: 'Technical Knowledge' },
        { id: 'codingQuality', label: 'Coding Quality' },
        { id: 'systemDesign', label: 'System Design' },
        { id: 'bestPractices', label: 'Best Practices' },
        { id: 'toolsProficiency', label: 'Tools Proficiency' }
      ]
    },
    final: {
      completed: false,
      scores: {},
      comments: {},
      average: null,
      salaryRange: '',
      noticePeriod: '',
      finalComments: '',
      criteria: [
        { id: 'cultureFit', label: 'Culture Fit' },
        { id: 'leadership', label: 'Leadership Potential' },
        { id: 'longTermVision', label: 'Long-term Vision' },
        { id: 'professionalism', label: 'Professionalism' },
        { id: 'overallImpression', label: 'Overall Impression' }
      ]
    }
  });

  // Load weights from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('evaluatorWeights');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.psychometric + parsed.technical + parsed.final === 100) {
          setWeights(parsed);
        }
      } catch (e) {
        console.error('Failed to load weights');
      }
    }
  }, []);

  // Alert system
  const showAlert = (message, type = 'info') => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: 'info' }), 3500);
  };

  // Navigation guards
  const canAccessScreen = (screen) => {
    if (screen === 'candidate' || screen === 'weights') return true;
    if (screen === 'psychometric') return candidate !== null;
    if (screen === 'technical') return candidate !== null; // Allow if candidate exists
    if (screen === 'final') return candidate !== null; // Allow if candidate exists
    if (screen === 'confidence') return stages.final.completed;
    return false;
  };

  const navigateTo = (screen) => {
    if (canAccessScreen(screen)) {
      setCurrentScreen(screen);
    } else {
      showAlert('Please complete the previous stages first', 'warning');
    }
  };

  // Candidate form handler
  const handleCandidateSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const candidateData = {
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      email: formData.get('email'),
      phone: formData.get('phone')
    };

    if (!candidateData.firstName || !candidateData.lastName || !candidateData.email || !candidateData.phone) {
      showAlert('Please fill all required fields', 'danger');
      return;
    }

    setCandidate(candidateData);
    showAlert('Candidate information saved successfully', 'success');
    navigateTo('psychometric');
  };

  // Stage evaluation handler
  const handleStageSubmit = (stageKey) => (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const stageData = { ...stages[stageKey] };
    
    let total = 0;
    let count = 0;

    stageData.criteria.forEach(criterion => {
      const score = parseInt(formData.get(`score-${criterion.id}`));
      const comment = formData.get(`comment-${criterion.id}`);
      
      if (!score || score < 1 || score > 5) {
        showAlert(`Please provide a score (1-5) for ${criterion.label}`, 'danger');
        return;
      }

      stageData.scores[criterion.id] = score;
      stageData.comments[criterion.id] = comment || '';
      total += score;
      count++;
    });

    if (count !== stageData.criteria.length) return;

    stageData.average = parseFloat((total / count).toFixed(2));
    stageData.completed = true;

    // Handle final stage extras
    if (stageKey === 'final') {
      stageData.salaryRange = formData.get('salaryRange') || '';
      stageData.noticePeriod = formData.get('noticePeriod') || '';
      stageData.finalComments = formData.get('finalComments') || '';
    }

    setStages({ ...stages, [stageKey]: stageData });
    showAlert(`${stageKey.charAt(0).toUpperCase() + stageKey.slice(1)} stage saved successfully`, 'success');

    // Navigate to next stage
    const nextScreens = { psychometric: 'technical', technical: 'final', final: 'confidence' };
    navigateTo(nextScreens[stageKey]);
  };

  // Weights handler
  const handleWeightsSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const newWeights = {
      psychometric: parseInt(formData.get('psychometric')),
      technical: parseInt(formData.get('technical')),
      final: parseInt(formData.get('final'))
    };

    const total = newWeights.psychometric + newWeights.technical + newWeights.final;
    if (total !== 100) {
      showAlert('Weights must total 100%', 'danger');
      return;
    }

    setWeights(newWeights);
    localStorage.setItem('evaluatorWeights', JSON.stringify(newWeights));
    showAlert('Weights updated successfully', 'success');
    navigateTo('candidate');
  };

  // Calculate final score
  const calculateFinalScore = () => {
    if (!stages.psychometric.completed || !stages.technical.completed || !stages.final.completed) {
      return null;
    }

    const scores = {
      psychometric: (stages.psychometric.average / 5) * 100,
      technical: (stages.technical.average / 5) * 100,
      final: (stages.final.average / 5) * 100
    };

    const finalScore = 
      (scores.psychometric * weights.psychometric / 100) +
      (scores.technical * weights.technical / 100) +
      (scores.final * weights.final / 100);

    return Math.round(finalScore);
  };

  const getRecommendation = (score) => {
    if (score >= 85) return { text: 'Highly Recommend', color: '#10b981' };
    if (score >= 70) return { text: 'Recommend', color: '#3b82f6' };
    if (score >= 55) return { text: 'Borderline', color: '#f59e0b' };
    return { text: 'Not Recommended', color: '#ef4444' };
  };

  const finalScore = calculateFinalScore();
  const recommendation = finalScore ? getRecommendation(finalScore) : null;

  return (
    <div style={{
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
      background: '#f8fafc'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1f7aed 0%, #1e40af 100%)',
        color: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 600 }}>
          PulseHire
        </h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{
            background: candidate ? '#10b981' : '#64748b',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            fontSize: '0.875rem',
            fontWeight: 500
          }}>
            {candidate ? `${candidate.firstName} ${candidate.lastName}` : 'No candidate loaded'}
          </span>
          <button
            onClick={() => navigateTo('weights')}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500
            }}
          >
            Stage Weights
          </button>
        </div>
      </header>

      {/* Alert */}
      <AnimatePresence>
        {alert.show && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'fixed',
              top: '5rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              background: alert.type === 'success' ? '#10b981' :
                         alert.type === 'danger' ? '#ef4444' :
                         alert.type === 'warning' ? '#f59e0b' : '#3b82f6',
              color: 'white',
              padding: '1rem 2rem',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              minWidth: '300px',
              textAlign: 'center',
              fontWeight: 500
            }}
          >
            {alert.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>
        {/* Sidebar */}
        <aside style={{
          width: '280px',
          background: 'white',
          padding: '2rem 1.5rem',
          borderRight: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Workflow
            </h3>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1rem' }}>
              Jump between stages once details are saved.
            </p>
            <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                { id: 'candidate', label: '1. Candidate Details' },
                { id: 'psychometric', label: '2. Psychometric Stage', requiresCandidate: true },
                { id: 'technical', label: '3. Technical Stage', requiresCandidate: true },
                { id: 'final', label: '4. Final Interview', requiresCandidate: true },
                { id: 'confidence', label: '5. Confidence Score', requiresStage: 'final' }
              ].map(item => {
                const isAccessible = canAccessScreen(item.id);
                const isCompleted = item.id === 'psychometric' ? stages.psychometric.completed :
                                  item.id === 'technical' ? stages.technical.completed :
                                  item.id === 'final' ? stages.final.completed : false;

                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    disabled={!isAccessible}
                    title={!isAccessible ? 'Complete previous stages first' : 'Click to view this stage'}
                    style={{
                      padding: '0.75rem 1rem',
                      textAlign: 'left',
                      border: 'none',
                      background: currentScreen === item.id ? '#eff6ff' : 'transparent',
                      color: currentScreen === item.id ? '#1f7aed' : isAccessible ? '#64748b' : '#cbd5e1',
                      borderLeft: currentScreen === item.id ? '3px solid #1f7aed' : '3px solid transparent',
                      cursor: isAccessible ? 'pointer' : 'not-allowed',
                      opacity: isAccessible ? 1 : 0.5,
                      fontWeight: 500,
                      fontSize: '0.9rem',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      position: 'relative'
                    }}
                  >
                    {item.label}
                    {isCompleted && (
                      <div style={{
                        marginLeft: 'auto',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#10b981',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        color: 'white',
                        fontWeight: 'bold'
                      }}>✓</div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div style={{
            background: '#f8fafc',
            padding: '1rem',
            borderRadius: '8px',
            marginTop: 'auto'
          }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem', color: '#475569' }}>
              Stage Weights
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Psychometric:</span>
                <strong style={{ color: '#1f7aed' }}>{weights.psychometric}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Technical:</span>
                <strong style={{ color: '#1f7aed' }}>{weights.technical}%</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Final Interview:</span>
                <strong style={{ color: '#1f7aed' }}>{weights.final}%</strong>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Candidate Details Screen */}
            {currentScreen === 'candidate' && (
              <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b', textAlign: 'center' }}>
                  Candidate Details
                </h2>
                <p style={{ color: '#64748b', marginBottom: '2rem', textAlign: 'center' }}>
                  Enter the candidate's basic information to begin the evaluation process.
                </p>

                <form onSubmit={handleCandidateSubmit} style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem', color: '#475569' }}>
                        First Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        defaultValue={candidate?.firstName}
                        required
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem', color: '#475569' }}>
                        Last Name <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        defaultValue={candidate?.lastName}
                        required
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem', color: '#475569' }}>
                        Email Address <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        defaultValue={candidate?.email}
                        required
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem', color: '#475569' }}>
                        Phone Number <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        defaultValue={candidate?.phone}
                        required
                        style={{
                          width: '100%',
                          padding: '0.875rem',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          fontSize: '1rem',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button type="submit" style={{
                      background: 'linear-gradient(135deg, #1f7aed 0%, #1e40af 100%)',
                      color: 'white',
                      padding: '0.875rem 2rem',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(31, 122, 237, 0.3)',
                      transition: 'transform 0.2s ease'
                    }}>
                      Save & Start Psychometric Stage
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Stage Evaluation Screens */}
            {['psychometric', 'technical', 'final'].map(stageKey => (
              currentScreen === stageKey && (
                <div key={stageKey} style={{ maxWidth: '900px', margin: '0 auto' }}>
                  {candidate && (
                    <div style={{
                      background: 'white',
                      padding: '1rem 1.5rem',
                      borderRadius: '8px',
                      marginBottom: '1.5rem',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '1rem',
                      fontSize: '0.875rem'
                    }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Candidate:</span>
                        <strong style={{ display: 'block', color: '#1e293b' }}>
                          {candidate.firstName} {candidate.lastName}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Email:</span>
                        <strong style={{ display: 'block', color: '#1e293b' }}>{candidate.email}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Phone:</span>
                        <strong style={{ display: 'block', color: '#1e293b' }}>{candidate.phone}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Stage:</span>
                        <strong style={{ display: 'block', color: '#1f7aed', textTransform: 'capitalize' }}>
                          {stageKey}
                        </strong>
                      </div>
                    </div>
                  )}

                  <h2 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b', textTransform: 'capitalize', textAlign: 'center' }}>
                    {stageKey} Interview Evaluation
                  </h2>
                  <p style={{ color: '#64748b', marginBottom: '2rem', textAlign: 'center' }}>
                    Rate each criterion on a scale of 1-5 and provide detailed comments.
                  </p>

                  <form onSubmit={handleStageSubmit(stageKey)}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                      {stages[stageKey].criteria.map(criterion => (
                        <div key={criterion.id} style={{
                          background: 'white',
                          padding: '1.5rem',
                          borderRadius: '12px',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}>
                          <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
                            {criterion.label}
                          </label>
                          <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1rem', alignItems: 'start' }}>
                            <div>
                              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                {[1, 2, 3, 4, 5].map(score => (
                                  <label key={score} style={{
                                    flex: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    cursor: 'pointer'
                                  }}>
                                    <input
                                      type="radio"
                                      name={`score-${criterion.id}`}
                                      value={score}
                                      defaultChecked={stages[stageKey].scores[criterion.id] === score}
                                      required
                                      style={{ marginBottom: '0.25rem' }}
                                    />
                                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>{score}</span>
                                  </label>
                                ))}
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                                <span>Poor</span>
                                <span>Excellent</span>
                              </div>
                            </div>
                            <textarea
                              name={`comment-${criterion.id}`}
                              defaultValue={stages[stageKey].comments[criterion.id]}
                              placeholder="Add your comments here..."
                              rows={3}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '0.875rem',
                                resize: 'vertical',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {stageKey === 'final' && (
                      <div style={{
                        background: 'white',
                        padding: '1.5rem',
                        borderRadius: '12px',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        marginBottom: '2rem'
                      }}>
                        <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
                          Additional Information
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#475569' }}>
                              Expected Salary Range
                            </label>
                            <input
                              type="text"
                              name="salaryRange"
                              defaultValue={stages.final.salaryRange}
                              placeholder="e.g., $80,000 - $100,000"
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                              }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#475569' }}>
                              Notice Period
                            </label>
                            <select
                              name="noticePeriod"
                              defaultValue={stages.final.noticePeriod}
                              style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #e2e8f0',
                                borderRadius: '6px',
                                fontSize: '0.875rem'
                              }}
                            >
                              <option value="">Select period</option>
                              <option value="Immediate">Immediate</option>
                              <option value="2 weeks">2 weeks</option>
                              <option value="1 month">1 month</option>
                              <option value="2 months">2 months</option>
                              <option value="3 months">3 months</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem', color: '#475569' }}>
                            Final Comments
                          </label>
                          <textarea
                            name="finalComments"
                            defaultValue={stages.final.finalComments}
                            placeholder="Overall assessment and key takeaways..."
                            rows={4}
                            style={{
                              width: '100%',
                              padding: '0.75rem',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              fontSize: '0.875rem',
                              resize: 'vertical',
                              boxSizing: 'border-box'
                            }}
                          />
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button type="submit" style={{
                        background: 'linear-gradient(135deg, #1f7aed 0%, #1e40af 100%)',
                        color: 'white',
                        padding: '0.875rem 2rem',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '1rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(31, 122, 237, 0.3)'
                      }}>
                        {stages[stageKey].completed ? 'Update & Continue' : 'Save & Continue'} to {stageKey === 'psychometric' ? 'Technical Stage' : stageKey === 'technical' ? 'Final Interview' : 'Confidence Score'}
                      </button>
                    </div>
                  </form>
                </div>
              )
            ))}

            {/* Confidence Score Screen */}
            {currentScreen === 'confidence' && finalScore !== null && (
              <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                {candidate && (
                  <div style={{
                    background: 'white',
                    padding: '1rem 1.5rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem' }}>
                      <div>
                        <span style={{ color: '#64748b' }}>Candidate:</span>
                        <strong style={{ display: 'block', color: '#1e293b' }}>
                          {candidate.firstName} {candidate.lastName}
                        </strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Email:</span>
                        <strong style={{ display: 'block', color: '#1e293b' }}>{candidate.email}</strong>
                      </div>
                      <div>
                        <span style={{ color: '#64748b' }}>Phone:</span>
                        <strong style={{ display: 'block', color: '#1e293b' }}>{candidate.phone}</strong>
                      </div>
                    </div>
                    <div style={{
                      background: recommendation.color,
                      color: 'white',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontWeight: 600,
                      fontSize: '0.875rem'
                    }}>
                      {recommendation.text}
                    </div>
                  </div>
                )}

                <div style={{
                  background: 'linear-gradient(135deg, #1f7aed 0%, #1e40af 100%)',
                  padding: '3rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  marginBottom: '2rem',
                  color: 'white'
                }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 500, marginBottom: '0.5rem', opacity: 0.9 }}>
                    Final Confidence Score
                  </h2>
                  <div style={{ fontSize: '5rem', fontWeight: 700, margin: '1rem 0' }}>
                    {finalScore}%
                  </div>
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(255,255,255,0.2)',
                    padding: '0.75rem 2rem',
                    borderRadius: '30px',
                    fontSize: '1.125rem',
                    fontWeight: 600
                  }}>
                    {recommendation.text}
                  </div>
                </div>

                {/* Candidate Comparison Section */}
                <div style={{ marginBottom: '3rem' }}>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem', color: '#1e293b', textAlign: 'center' }}>
                    Candidate Comparison
                  </h3>
                  <p style={{ color: '#64748b', marginBottom: '2rem', textAlign: 'center' }}>
                    Compare your evaluated candidate with other applicants
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                    {/* Current Candidate */}
                    <div style={{
                      background: 'white',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px rgba(31, 122, 237, 0.2)',
                      border: '2px solid #1f7aed',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: '#1f7aed',
                        color: 'white',
                        padding: '0.25rem 1rem',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}>
                        Current
                      </div>
                      <div style={{ textAlign: 'center', marginBottom: '1rem', marginTop: '0.5rem' }}>
                        <img
                          src="https://images.stockcake.com/public/5/5/a/55aa0081-3d0d-495b-b649-4838f12aedd3_large/professional-young-man-stockcake.jpg"
                          alt={`${candidate.firstName} ${candidate.lastName}`}
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            margin: '0 auto 1rem',
                            border: '3px solid #1f7aed'
                          }}
                        />
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
                          {candidate.firstName} {candidate.lastName}
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>{candidate.email}</p>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, #1f7aed 0%, #1e40af 100%)',
                        color: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        textAlign: 'center',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>{finalScore}%</div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Confidence Score</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                        {[
                          { label: 'Psychometric', score: stages.psychometric.average, color: '#1f7aed' },
                          { label: 'Technical', score: stages.technical.average, color: '#2ec4b6' },
                          { label: 'Final', score: stages.final.average, color: '#ff9f1c' }
                        ].map(stage => (
                          <div key={stage.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#64748b' }}>{stage.label}:</span>
                            <span style={{ fontWeight: 600, color: stage.color }}>{stage.score.toFixed(1)}/5</span>
                          </div>
                        ))}
                      </div>
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: recommendation.color,
                        color: 'white',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}>
                        {recommendation.text}
                      </div>
                    </div>

                    {/* Static Candidate 1 - Sarah Johnson */}
                    <div style={{
                      background: 'white',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      opacity: 0.85
                    }}>
                      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <img
                          src="https://img.freepik.com/free-photo/front-view-business-woman-suit_23-2148603018.jpg?semt=ais_hybrid&w=740&q=80"
                          alt="Sarah Johnson"
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            margin: '0 auto 1rem',
                            border: '3px solid #10b981'
                          }}
                        />
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
                          Sarah Johnson
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>sarah.j@email.com</p>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        textAlign: 'center',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>88%</div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Confidence Score</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Psychometric:</span>
                          <span style={{ fontWeight: 600, color: '#1f7aed' }}>4.6/5</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Technical:</span>
                          <span style={{ fontWeight: 600, color: '#2ec4b6' }}>4.4/5</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Final:</span>
                          <span style={{ fontWeight: 600, color: '#ff9f1c' }}>4.2/5</span>
                        </div>
                      </div>
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: '#10b981',
                        color: 'white',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}>
                        Highly Recommend
                      </div>
                    </div>

                    {/* Static Candidate 2 - Michael Chen */}
                    <div style={{
                      background: 'white',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      opacity: 0.85
                    }}>
                      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <img
                          src="https://images.squarespace-cdn.com/content/v1/5521b031e4b06ebe90178744/4edee838-e14b-4033-a9c1-8e3664b2c567/business-corporate-headshots-portrait-male.jpg"
                          alt="Michael Chen"
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            margin: '0 auto 1rem',
                            border: '3px solid #3b82f6'
                          }}
                        />
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
                          Michael Chen
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>m.chen@email.com</p>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        color: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        textAlign: 'center',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>76%</div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Confidence Score</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Psychometric:</span>
                          <span style={{ fontWeight: 600, color: '#1f7aed' }}>3.8/5</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Technical:</span>
                          <span style={{ fontWeight: 600, color: '#2ec4b6' }}>4.0/5</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Final:</span>
                          <span style={{ fontWeight: 600, color: '#ff9f1c' }}>3.6/5</span>
                        </div>
                      </div>
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: '#3b82f6',
                        color: 'white',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}>
                        Recommend
                      </div>
                    </div>

                    {/* Static Candidate 3 - Emily Rodriguez */}
                    <div style={{
                      background: 'white',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                      opacity: 0.85
                    }}>
                      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                        <img
                          src="https://images.squarespace-cdn.com/content/v1/5cfb0f8783523500013c5639/2f93ecab-2aaa-4b12-af29-d0cb0eb2e368/Professional-Headshot-Vancouver"
                          alt="Emily Rodriguez"
                          style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            margin: '0 auto 1rem',
                            border: '3px solid #f59e0b'
                          }}
                        />
                        <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>
                          Emily Rodriguez
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>e.rodriguez@email.com</p>
                      </div>
                      <div style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        color: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        textAlign: 'center',
                        marginBottom: '1rem'
                      }}>
                        <div style={{ fontSize: '2.5rem', fontWeight: 700 }}>62%</div>
                        <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Confidence Score</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Psychometric:</span>
                          <span style={{ fontWeight: 600, color: '#1f7aed' }}>3.2/5</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Technical:</span>
                          <span style={{ fontWeight: 600, color: '#2ec4b6' }}>3.0/5</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748b' }}>Final:</span>
                          <span style={{ fontWeight: 600, color: '#ff9f1c' }}>3.4/5</span>
                        </div>
                      </div>
                      <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: '#f59e0b',
                        color: 'white',
                        borderRadius: '8px',
                        textAlign: 'center',
                        fontWeight: 600,
                        fontSize: '0.875rem'
                      }}>
                        Borderline
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
                      Score Breakdown
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {[
                        { key: 'psychometric', label: 'Psychometric', color: '#1f7aed' },
                        { key: 'technical', label: 'Technical', color: '#2ec4b6' },
                        { key: 'final', label: 'Final Interview', color: '#ff9f1c' }
                      ].map(stage => {
                        const normalized = (stages[stage.key].average / 5) * 100;
                        const contribution = (normalized * weights[stage.key]) / 100;
                        return (
                          <div key={stage.key} style={{
                            padding: '1rem',
                            background: '#f8fafc',
                            borderRadius: '8px',
                            borderLeft: `4px solid ${stage.color}`
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                              <span style={{ fontWeight: 600, color: '#1e293b' }}>{stage.label}</span>
                              <span style={{
                                background: stage.color,
                                color: 'white',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}>
                                {contribution.toFixed(1)} pts
                              </span>
                            </div>
                            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                              Average: {stages[stage.key].average.toFixed(2)} / 5 (Weight: {weights[stage.key]}%)
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{
                    background: 'white',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                  }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
                      Interview Feedback Summary
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '400px', overflowY: 'auto' }}>
                      {[
                        { key: 'psychometric', label: 'Psychometric Stage' },
                        { key: 'technical', label: 'Technical Stage' },
                        { key: 'final', label: 'Final Interview' }
                      ].map(stage => {
                        const comments = Object.values(stages[stage.key].comments).filter(Boolean);
                        if (stage.key === 'final') {
                          if (stages.final.salaryRange) comments.push(`Expected Salary: ${stages.final.salaryRange}`);
                          if (stages.final.noticePeriod) comments.push(`Notice Period: ${stages.final.noticePeriod}`);
                          if (stages.final.finalComments) comments.push(stages.final.finalComments);
                        }
                        return (
                          <div key={stage.key} style={{
                            padding: '1rem',
                            background: '#f8fafc',
                            borderRadius: '8px'
                          }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b' }}>
                              {stage.label}
                            </h4>
                            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: '1.6' }}>
                              {comments.length > 0 ? comments.join(' • ') : 'No comments provided.'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{
                  background: 'white',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
                    Stage Comparison Chart
                  </h3>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', height: '200px', padding: '1rem' }}>
                    {[
                      { key: 'psychometric', label: 'Psychometric', color: '#1f7aed' },
                      { key: 'technical', label: 'Technical', color: '#2ec4b6' },
                      { key: 'final', label: 'Final', color: '#ff9f1c' }
                    ].map(stage => {
                      const height = (stages[stage.key].average / 5) * 100;
                      return (
                        <div key={stage.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 600, color: stage.color }}>
                            {stages[stage.key].average.toFixed(2)}
                          </div>
                          <div style={{
                            width: '100%',
                            height: `${height}%`,
                            background: `linear-gradient(to top, ${stage.color}, ${stage.color}dd)`,
                            borderRadius: '8px 8px 0 0',
                            minHeight: '20px',
                            transition: 'height 0.3s ease'
                          }} />
                          <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center' }}>
                            {stage.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Weights Configuration Screen */}
            {currentScreen === 'weights' && (
              <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 600, marginBottom: '0.5rem', color: '#1e293b', textAlign: 'center' }}>
                  Configure Stage Weights
                </h2>
                <p style={{ color: '#64748b', marginBottom: '2rem', textAlign: 'center' }}>
                  Adjust how much each interview stage contributes to the final confidence score. Total must equal 100%.
                </p>

                <form onSubmit={handleWeightsSubmit} style={{
                  background: 'white',
                  padding: '2rem',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
                    {[
                      { key: 'psychometric', label: 'Psychometric Stage', color: '#1f7aed' },
                      { key: 'technical', label: 'Technical Stage', color: '#2ec4b6' },
                      { key: 'final', label: 'Final Interview', color: '#ff9f1c' }
                    ].map(stage => (
                      <div key={stage.key} style={{
                        padding: '1.5rem',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${stage.color}`
                      }}>
                        <label style={{ display: 'block', fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#1e293b' }}>
                          {stage.label}
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                          <input
                            type="range"
                            name={stage.key}
                            min="0"
                            max="100"
                            step="5"
                            defaultValue={weights[stage.key]}
                            style={{ flex: 1 }}
                          />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="5"
                            defaultValue={weights[stage.key]}
                            style={{
                              width: '80px',
                              padding: '0.5rem',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              textAlign: 'center',
                              fontWeight: 600,
                              color: stage.color
                            }}
                            onChange={(e) => {
                              const slider = e.target.parentElement.querySelector('input[type="range"]');
                              slider.value = e.target.value;
                            }}
                          />
                          <span style={{ fontSize: '1.25rem', fontWeight: 600, color: stage.color, width: '30px' }}>%</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{
                    background: '#fef3c7',
                    border: '1px solid #fde68a',
                    borderRadius: '8px',
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    fontSize: '0.875rem',
                    color: '#92400e'
                  }}>
                    <strong>Note:</strong> The sum of all weights must equal exactly 100%. Adjust the sliders or input values directly.
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #1f7aed 0%, #1e40af 100%)',
                      color: 'white',
                      padding: '0.875rem 2rem',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(31, 122, 237, 0.3)'
                    }}>
                      Save Weights
                    </button>
                    <button type="button" onClick={() => navigateTo('candidate')} style={{
                      flex: 1,
                      background: 'white',
                      color: '#64748b',
                      padding: '0.875rem 2rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
