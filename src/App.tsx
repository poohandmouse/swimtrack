import { useState } from 'react'
import { Header } from './components/layout/Header'
import { Nav, type Page } from './components/layout/Nav'
import { EmptyState } from './components/EmptyState'
import { useAppState } from './hooks/useAppState'
import { DashboardPage } from './pages/DashboardPage'
import { AddResultPage } from './pages/AddResultPage'
import { ResultsPage } from './pages/ResultsPage'
import { GoalsPage } from './pages/GoalsPage'
import { TrainingPage } from './pages/TrainingPage'
import { AnalysisPage } from './pages/AnalysisPage'
import { ProfilesPage } from './pages/ProfilesPage'
import { ImportResultsPage } from './pages/ImportResultsPage'
import { exportMeetReport } from './utils/exportPdf'

const PAGE_LABELS: Record<Exclude<Page, 'profiles'>, string> = {
  dashboard: 'the dashboard',
  add: 'adding results',
  import: 'importing results',
  results: 'swim history',
  goals: 'goal tracking',
  training: 'training notes',
  analysis: 'performance analysis',
}

function renderPage(page: Page, app: ReturnType<typeof useAppState>) {
  switch (page) {
    case 'profiles':
      return <ProfilesPage app={app} />
    case 'dashboard':
      return <DashboardPage app={app} />
    case 'add':
      return <AddResultPage app={app} />
    case 'import':
      return <ImportResultsPage app={app} />
    case 'results':
      return <ResultsPage app={app} />
    case 'goals':
      return <GoalsPage app={app} />
    case 'training':
      return <TrainingPage app={app} />
    case 'analysis':
      return <AnalysisPage app={app} />
  }
}

export default function App() {
  const app = useAppState()
  const [page, setPage] = useState<Page>(() =>
    app.state.swimmers.length === 0 ? 'profiles' : 'dashboard'
  )

  const hasSwimmer = app.activeSwimmer !== null

  const handleExport = () => {
    if (app.activeSwimmer) {
      exportMeetReport(app.activeSwimmer, app.state.results)
    }
  }

  const mainContent =
    page === 'profiles' ? (
      <ProfilesPage app={app} />
    ) : !hasSwimmer ? (
      <EmptyState
        title="Create a swimmer profile first"
        description={`You need at least one swimmer profile before using ${PAGE_LABELS[page]}. Add a name, club, and state on the Profiles tab to get started.`}
        action={
          <button type="button" className="btn-primary" onClick={() => setPage('profiles')}>
            Go to Profiles
          </button>
        }
      />
    ) : (
      renderPage(page, app)
    )

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Header
        swimmers={app.state.swimmers}
        activeSwimmer={app.activeSwimmer}
        onSelectSwimmer={app.setActiveSwimmer}
        onToggleTheme={app.toggleTheme}
        theme={app.state.theme}
        onExport={handleExport}
        onManageProfiles={() => setPage('profiles')}
      />
      <Nav page={page} onNavigate={setPage} />

      <main className="max-w-6xl mx-auto px-4 py-6">{mainContent}</main>
    </div>
  )
}