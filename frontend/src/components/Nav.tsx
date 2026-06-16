interface Props {
  rightSlot?: React.ReactNode
  logoHref?: string
}

export default function Nav({ rightSlot, logoHref = '/' }: Props) {
  return (
    <nav className="flex items-center justify-between px-16 py-5 border-b border-sep sticky top-0 z-50"
      style={{ background: 'rgba(9,9,15,0.85)', backdropFilter: 'blur(12px)' }}>
      <a href={logoHref} className="flex items-center gap-2.5 font-bold text-lg text-ink hover:opacity-80 transition-opacity no-underline">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-white text-sm">◆</div>
        PatternSense
      </a>
      {rightSlot && <div>{rightSlot}</div>}
    </nav>
  )
}
