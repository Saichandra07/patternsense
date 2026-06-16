import Nav from '../components/Nav'

export default function Landing() {
  return (
    <div className="min-h-screen bg-page flex flex-col" style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <Nav rightSlot={
        <div className="flex items-center gap-3">
          <a href="/login"
            className="border border-sep text-ink-secondary px-4 py-2 rounded-lg text-sm hover:border-accent-text hover:text-ink transition-all">
            Sign In
          </a>
          <a href="/signup"
            className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#6D28D9] transition-colors">
            Get Started Free
          </a>
        </div>
      } />

      {/* Hero */}
      <section className="flex flex-col items-center text-center px-16 pt-24 pb-20 relative overflow-hidden">
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />

        <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-accent-text text-sm font-medium mb-8 relative"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)' }}>
          <div className="w-1.5 h-1.5 rounded-full bg-accent-text" />
          Built for developers who want to actually understand DSA
        </div>

        <h1 className="text-ink font-extrabold leading-none tracking-tight mb-5 relative"
          style={{ fontSize: '64px', letterSpacing: '-2px', maxWidth: '700px' }}>
          Stop grinding.<br /><span className="text-accent-text">Start thinking.</span>
        </h1>

        <p className="text-ink-secondary mb-10 leading-relaxed relative"
          style={{ fontSize: '19px', maxWidth: '520px' }}>
          Every DSA tool gives you hints. PatternSense asks you questions — until you see the answer yourself. That's how real intuition is built.
        </p>

        <div className="flex items-center gap-3.5 relative">
          <a href="/signup"
            className="bg-accent text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-[#6D28D9] transition-colors">
            Start Learning Free →
          </a>
          <button className="border border-sep text-ink-secondary px-8 py-3.5 rounded-xl text-base hover:border-accent-text hover:text-ink transition-all">
            See how it works
          </button>
        </div>
        <p className="text-ink-muted text-sm mt-4 relative">Free to start · No credit card · Bring your own AI key</p>
      </section>

      {/* Live session preview */}
      <section className="px-16 pb-20">
        <p className="text-center text-ink-muted text-xs font-medium tracking-widest uppercase mb-7">
          A real session — watch the thinking happen
        </p>
        <div className="max-w-3xl mx-auto bg-surface border border-sep rounded-2xl overflow-hidden">
          {/* Window chrome */}
          <div className="px-5 py-3.5 bg-elevated border-b border-sep flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
            <div className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
            <div className="w-3 h-3 rounded-full bg-[#28C840]" />
            <span className="ml-2 text-ink-secondary text-sm">Session · Sliding Window · LC 3</span>
          </div>

          <div className="p-7">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-success text-xs mb-5"
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              Medium · Sliding Window
            </div>
            <p className="text-ink font-semibold text-base mb-5">Longest Substring Without Repeating Characters</p>

            <div className="flex flex-col gap-4">
              {/* App message */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-accent-text text-sm flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>◆</div>
                <div className="flex-1 px-4 py-3 rounded-xl text-ink text-sm leading-relaxed"
                  style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
                  <p className="text-accent-text text-xs font-semibold tracking-wide mb-1">PATTERNSENSE</p>
                  Before we solve — what kind of problem does this feel like to you?
                </div>
              </div>

              {/* User message */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg bg-elevated border border-sep flex items-center justify-center text-ink-secondary text-xs flex-shrink-0">U</div>
                <div className="flex-1 px-4 py-3 rounded-xl bg-elevated border border-sep text-ink-secondary text-sm leading-relaxed">
                  <p className="text-ink-muted text-xs font-semibold tracking-wide mb-1">YOU</p>
                  I think it's a sliding window problem...
                </div>
              </div>

              {/* App message */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-accent-text text-sm flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>◆</div>
                <div className="flex-1 px-4 py-3 rounded-xl text-ink text-sm leading-relaxed"
                  style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
                  <p className="text-accent-text text-xs font-semibold tracking-wide mb-1">PATTERNSENSE</p>
                  Good instinct. What in the problem tells you that? Point to something specific.
                </div>
              </div>

              {/* User message */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg bg-elevated border border-sep flex items-center justify-center text-ink-secondary text-xs flex-shrink-0">U</div>
                <div className="flex-1 px-4 py-3 rounded-xl bg-elevated border border-sep text-ink-secondary text-sm leading-relaxed">
                  <p className="text-ink-muted text-xs font-semibold tracking-wide mb-1">YOU</p>
                  We're looking for a substring — a continuous range that can expand and shrink?
                </div>
              </div>

              {/* App message */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-accent-text text-sm flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>◆</div>
                <div className="flex-1 px-4 py-3 rounded-xl text-ink text-sm leading-relaxed"
                  style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
                  <p className="text-accent-text text-xs font-semibold tracking-wide mb-1">PATTERNSENSE</p>
                  Right. Now — what's the condition that forces the window to shrink? Think about what makes a substring invalid here.
                </div>
              </div>

              {/* Typing indicator */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center text-accent-text text-sm flex-shrink-0"
                  style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>◆</div>
                <div className="px-4 py-3 rounded-xl flex items-center gap-1"
                  style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.1)' }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-text animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-text animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-text animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars */}
      <section className="px-16 pb-20">
        <div className="grid grid-cols-3 gap-5 max-w-4xl mx-auto">
          {[
            { icon: '🎯', title: 'Not hints — questions', desc: 'Every other tool gives you the answer when you\'re stuck. PatternSense asks you the one question that makes you find it yourself.' },
            { icon: '🧠', title: 'Designed for you specifically', desc: 'It reads your reasoning, finds exactly where your thinking breaks, and targets that gap — not a generic next hint.' },
            { icon: '🔗', title: 'Any problem, any source', desc: 'Paste a LeetCode URL for auto-fetch or paste any problem from any platform. It works the same either way.' },
          ].map(p => (
            <div key={p.title} className="bg-surface border border-sep rounded-2xl p-7">
              <div className="text-2xl mb-3.5">{p.icon}</div>
              <h3 className="text-ink font-semibold text-base mb-2">{p.title}</h3>
              <p className="text-ink-secondary text-sm leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA strip */}
      <section className="mx-16 mb-20 text-center rounded-2xl p-14"
        style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.08) 0%, #111118 100%)', border: '1px solid #232330' }}>
        <h2 className="text-ink font-bold mb-3.5" style={{ fontSize: '36px' }}>Ready to stop grinding?</h2>
        <p className="text-ink-secondary text-base mb-8">Join developers building real DSA intuition — not just a higher solved count.</p>
        <a href="/signup"
          className="inline-block bg-accent text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-[#6D28D9] transition-colors">
          Get Started Free →
        </a>
      </section>
    </div>
  )
}
