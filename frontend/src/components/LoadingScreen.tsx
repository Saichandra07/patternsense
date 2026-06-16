export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-page flex flex-col items-center justify-center relative overflow-hidden"
      style={{ fontFamily: 'Inter, -apple-system, sans-serif' }}>
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.14) 0%, transparent 65%)' }} />
      <div className="flex items-center gap-2.5 mb-8 relative z-10">
        <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center text-white text-lg">◆</div>
        <span className="text-ink font-bold text-xl">PatternSense</span>
      </div>
      <div className="flex items-center gap-1.5 relative z-10">
        <span className="w-2 h-2 rounded-full bg-accent-text animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 rounded-full bg-accent-text animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 rounded-full bg-accent-text animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
