import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

const FEATURES = [
  { icon: '↗', title: 'Training that fits you', desc: 'Plans shaped around your goals and schedule.' },
  { icon: '◉', title: 'Progress you can follow', desc: 'A clearer picture of every session and milestone.' },
  { icon: '✦', title: 'Guidance when you need it', desc: 'Personalized workout and nutrition insights.' },
];

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [error, setError] = useState('');

  function switchTab(next) {
    setError('');
    setTab(next);
  }

  return <main className="auth-page">
    <div className="auth-background-glow" aria-hidden="true"/><div className="auth-grid-texture" aria-hidden="true"/>
    <div className="auth-shell">
      <section className="auth-story" aria-label="FITAI introduction">
        <a className="auth-brand" href="/login" aria-label="FITAI home"><span className="auth-brand-mark">F</span><span>FIT<span>AI</span></span></a>
        <div className="auth-story-copy"><span className="auth-kicker"><i/> YOUR FITNESS, IN FOCUS</span><h1>Make progress<br/>feel <em>personal.</em></h1><p>One place to plan your training, build better habits, and see how far you’ve come.</p></div>
        <div className="auth-feature-list">{FEATURES.map((feature) => <article key={feature.title}><span>{feature.icon}</span><div><strong>{feature.title}</strong><small>{feature.desc}</small></div><i>↗</i></article>)}</div>
        <div className="auth-story-footer"><span>FITAI</span><span>YOUR NEXT SESSION STARTS HERE</span></div>
      </section>

      <section className="auth-panel" aria-label={tab === 'login' ? 'Sign in' : 'Create account'}>
        <div className="auth-panel-inner">
          <div className="auth-mobile-brand"><span className="auth-brand-mark">F</span><strong>FIT<span>AI</span></strong></div>
          <div className="auth-heading"><span className="auth-kicker"><i/> {tab === 'login' ? 'WELCOME BACK' : 'START YOUR JOURNEY'}</span><h2>{tab === 'login' ? 'Good to see you.' : 'Build your routine.'}</h2><p>{tab === 'login' ? 'Sign in to pick up where you left off.' : 'Create your account and make fitness your own.'}</p></div>
          <div className="auth-tabs" role="tablist" aria-label="Account access">
            <button type="button" role="tab" aria-selected={tab === 'login'} className={tab === 'login' ? 'active' : ''} onClick={() => switchTab('login')}>Sign in</button>
            <button type="button" role="tab" aria-selected={tab === 'signup'} className={tab === 'signup' ? 'active' : ''} onClick={() => switchTab('signup')}>Create account</button>
          </div>
          {error && <div className="auth-error" role="alert"><span>!</span><p>{error}</p><button type="button" onClick={() => setError('')} aria-label="Dismiss error">×</button></div>}
          <div key={tab} className="auth-form-wrap">{tab === 'login' ? <LoginForm onError={setError}/> : <SignupForm onError={setError}/>}</div>
          {tab === 'login' && import.meta.env.DEV && <div className="auth-demo"><span>DEV PREVIEW</span><p>Username <strong>demo</strong><b>·</b> Password <strong>demo@1234</strong></p></div>}
          <div className="auth-privacy"><span>⌑</span><p>Your account details are protected and used to personalize your FITAI experience.</p></div>
          <div className="auth-legal">By continuing, you agree to use FITAI as a fitness support tool. It does not replace professional medical advice.</div>
        </div>
      </section>
    </div>
  </main>;
}
