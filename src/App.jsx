import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { I18nProvider } from './i18n/I18nProvider'
import { TradesProvider } from './trades/TradesProvider'
import { AuthProvider } from './auth/AuthProvider'
import RequireRole from './auth/RequireRole'
import PublicOnly from './auth/PublicOnly'
import Layout from './components/layout/Layout'
import Home from './pages/Home'
import Jobs from './pages/Jobs'
import JobDetail from './pages/JobDetail'
import Workers from './pages/Workers'
import WorkerDetail from './pages/WorkerDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import About from './pages/About'
import NotFound from './pages/NotFound'
import EmployerLayout from './pages/dash/employer/EmployerLayout'
import EmployerOverview from './pages/dash/employer/Overview'
import EmployerMyJobs from './pages/dash/employer/MyJobs'
import EmployerApplicants from './pages/dash/employer/Applicants'
import EmployerSettings from './pages/dash/employer/Settings'
import WorkerLayout from './pages/dash/worker/WorkerLayout'
import WorkerOverview from './pages/dash/worker/Overview'
import WorkerProfile from './pages/dash/worker/Profile'
import WorkerApplications from './pages/dash/worker/Applications'
import WorkerSettings from './pages/dash/worker/Settings'
import AdminLayout from './pages/dash/admin/AdminLayout'
import AdminOverview from './pages/dash/admin/Overview'
import AdminUsers from './pages/dash/admin/Users'
import AdminModeration from './pages/dash/admin/Moderation'
import AdminReports from './pages/dash/admin/Reports'
import AdminCategories from './pages/dash/admin/Categories'

// Active dès maintenant les comportements de React Router v7.
// Sans ces drapeaux, la console affiche deux avertissements de dépréciation.
const future = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}

export default function App() {
  return (
    <I18nProvider>
      <TradesProvider>
        <AuthProvider>
          <BrowserRouter future={future}>
            <Routes>
              {/* Pages vitrine : réservées aux visiteurs (cf. PublicOnly).
                  Le catalogue reste ouvert à tous, connectés compris. */}
              <Route element={<Layout />}>
                <Route index element={<PublicOnly><Home /></PublicOnly>} />
                <Route path="offres" element={<Jobs />} />
                <Route path="offres/:id" element={<JobDetail />} />
                <Route path="travailleurs" element={<Workers />} />
                <Route path="travailleurs/:id" element={<WorkerDetail />} />
                <Route path="connexion" element={<PublicOnly><Login /></PublicOnly>} />
                <Route path="inscription" element={<PublicOnly><Register /></PublicOnly>} />
                <Route path="a-propos" element={<PublicOnly><About /></PublicOnly>} />
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Espaces connectés : hors du layout public */}
              <Route
                path="/tableau-de-bord/employeur"
                element={
                  <RequireRole role="employer">
                    <EmployerLayout />
                  </RequireRole>
                }
              >
                <Route index element={<EmployerOverview />} />
                <Route path="annonces" element={<EmployerMyJobs />} />
                <Route path="candidatures" element={<EmployerApplicants />} />
                <Route path="parametres" element={<EmployerSettings />} />
              </Route>
              <Route
                path="/tableau-de-bord/travailleur"
                element={
                  <RequireRole role="worker">
                    <WorkerLayout />
                  </RequireRole>
                }
              >
                <Route index element={<WorkerOverview />} />
                <Route path="profil" element={<WorkerProfile />} />
                <Route path="candidatures" element={<WorkerApplications />} />
                <Route path="parametres" element={<WorkerSettings />} />
              </Route>

              {/* Administration : sous-routes dans une coquille dédiée */}
              <Route
                path="/admin"
                element={
                  <RequireRole role="admin">
                    <AdminLayout />
                  </RequireRole>
                }
              >
                <Route index element={<AdminOverview />} />
                <Route path="utilisateurs" element={<AdminUsers />} />
                <Route path="moderation" element={<AdminModeration />} />
                <Route path="signalements" element={<AdminReports />} />
                <Route path="categories" element={<AdminCategories />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TradesProvider>
    </I18nProvider>
  )
}
