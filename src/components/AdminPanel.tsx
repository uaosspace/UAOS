interface AdminPanelProps {
  currentLang: string
  onNavigate: (route: 'home') => void
  onRefreshData?: () => void
}

/** Legacy stub — operational admin is /admin (Neon-backed). */
export default function AdminPanel({onNavigate}: AdminPanelProps) {
  return (
    <div className="mx-auto max-w-lg p-8">
      <h1 className="text-xl font-semibold">Admin hub moved</h1>
      <p className="mt-2 text-sm text-slate-600">
        Sanity Studio is removed. Use the protected console at <code>/admin</code>.
      </p>
      <button className="mt-4 rounded border px-3 py-2 text-sm" onClick={() => onNavigate('home')}>
        Back to home
      </button>
    </div>
  )
}
