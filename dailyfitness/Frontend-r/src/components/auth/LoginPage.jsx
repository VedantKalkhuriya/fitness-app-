import { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

const FEATURES = [
  { icon: '🥗', title: 'AI Diet Plans', desc: 'Personalised 7-day meal plans' },
  { icon: '💪', title: 'Smart Workouts', desc: 'Plans tailored to your goals' },
  { icon: '🤖', title: 'AI Coach Feedback', desc: 'Get advice on your progress' },
];

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [error, setError] = useState('');

  function switchTab(next) {
    setError('');
    setTab(next);
  }

  return (
    <div className="flex min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="relative flex flex-1 flex-col justify-center overflow-hidden p-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(16,185,129,0.18),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />

        <div className="relative z-10">
          <div className="text-5xl font-black uppercase tracking-[0.25em] text-emerald-400">
            FIT<span className="text-slate-100">AI</span>
          </div>
          <div className="mt-3 text-base text-slate-300">Your AI-powered personal fitness coach</div>

          <ul className="mt-12 space-y-5">
            {FEATURES.map((f) => (
              <li className="flex items-center gap-4" key={f.title}>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-xl">
                  {f.icon}
                </div>
                <div>
                  <div className="text-base font-semibold text-slate-100">{f.title}</div>
                  <div className="text-sm text-slate-400">{f.desc}</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-16 flex gap-10">
            <div>
              <div className="text-4xl font-black tracking-[0.1em] text-emerald-400">10k+</div>
              <div className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-black tracking-[0.1em] text-emerald-400">50k+</div>
              <div className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">Workouts Logged</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex w-[480px] items-center justify-center border-l border-slate-700 bg-slate-900/80 p-12">
        <div className="w-full">
          <div className="mb-8">
            <div className="text-4xl font-black uppercase tracking-[0.2em] text-slate-100">
              {tab === 'login' ? 'WELCOME' : 'JOIN US'}
            </div>
            <div className="mt-2 text-sm text-slate-400">
              {tab === 'login' ? 'Sign in to your fitness journey' : 'Start your transformation today'}
            </div>
          </div>

          <div className="mb-8 flex gap-1 rounded-2xl bg-slate-800 p-1">
            <button
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                tab === 'login'
                  ? 'bg-emerald-400 text-slate-950'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
              onClick={() => switchTab('login')}
            >
              Sign In
            </button>
            <button
              className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                tab === 'signup'
                  ? 'bg-emerald-400 text-slate-950'
                  : 'text-slate-400 hover:text-slate-100'
              }`}
              onClick={() => switchTab('signup')}
            >
              Sign Up
            </button>
          </div>

          <div
            className={`mb-4 rounded-xl border px-3 py-2.5 text-sm ${
              error
                ? 'block border-rose-500/40 bg-rose-500/10 text-rose-300'
                : 'hidden border-transparent bg-transparent text-transparent'
            }`}
          >
            {error}
          </div>

          {tab === 'login' ? <LoginForm onError={setError} /> : <SignupForm onError={setError} />}

          <div className="mt-6 text-center text-sm text-slate-400">
            {tab === 'login' ? (
              <>
                New here?{' '}
                <button className="font-semibold text-emerald-300" onClick={() => switchTab('signup')}>
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button className="font-semibold text-emerald-300" onClick={() => switchTab('login')}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
