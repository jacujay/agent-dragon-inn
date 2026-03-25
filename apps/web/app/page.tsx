export default function HomePage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-5xl px-6 py-16">
        <header className="mb-12">
          <h1 className="text-5xl font-bold text-primary mb-2">Agent Dragon Inn</h1>
          <p className="text-xl text-muted-foreground">The OS for your AI agent workforce</p>
        </header>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: 'Agents', desc: 'Design, version, and manage your AI agents', icon: '🤖' },
            { title: 'Workflows', desc: 'Build multi-agent pipelines with a visual editor', icon: '🔗' },
            { title: 'Observability', desc: 'Full-stack tracing, cost tracking, and analytics', icon: '📊' },
          ].map(({ title, desc, icon }) => (
            <div key={title} className="rounded-lg border border-border bg-card p-6">
              <span className="text-3xl">{icon}</span>
              <h2 className="mt-4 text-lg font-semibold text-foreground">{title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-lg border border-border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-2">平台状态</h2>
          <p className="text-sm text-muted-foreground">MVP 正在开发中，预计 {new Date().getFullYear()} 年 {new Date().getMonth()+2} 月上线。</p>
        </div>
      </div>
    </main>
  )
}
