import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AdminRoute, AdminShell, AppShell, ProtectedRoute, RootLayout } from '@/components/layout/Layouts';
import { PageLoader } from '@/components/common/States';
import LandingPage from '@/pages/Landing/LandingPage';

// Route-level code splitting: only the landing page is in the initial bundle.
const LoginPage = lazy(() => import('@/pages/Auth/LoginPage'));
const RegisterPage = lazy(() => import('@/pages/Auth/RegisterPage'));
const OnboardingPage = lazy(() => import('@/pages/Onboarding/OnboardingPage'));
const ProfilePage = lazy(() => import('@/pages/Onboarding/ProfilePage'));
const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage'));
const ExplorerPage = lazy(() => import('@/pages/Schemes/ExplorerPage'));
const SchemeDetailPage = lazy(() => import('@/pages/Schemes/SchemeDetailPage'));
const SavedPage = lazy(() => import('@/pages/Saved/SavedPage'));
const DeadlinesPage = lazy(() => import('@/pages/Deadlines/DeadlinesPage'));
const ChecklistPage = lazy(() => import('@/pages/Checklist/ChecklistPage'));
const ApplicationsPage = lazy(() => import('@/pages/Applications/ApplicationsPage'));
const AdminDashboardPage = lazy(() => import('@/pages/Admin/AdminDashboardPage'));
const AdminSchemesPage = lazy(() => import('@/pages/Admin/AdminSchemesPage'));
const SchemeEditorPage = lazy(() => import('@/pages/Admin/SchemeEditorPage'));
const InfoPage = lazy(() => import('@/pages/Info/InfoPage'));
const NotFoundPage = lazy(() => import('@/pages/Info/NotFoundPage'));

export function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<LandingPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route path="schemes" element={<ExplorerPage />} />
          <Route path="schemes/:id" element={<SchemeDetailPage />} />
          <Route path="about" element={<InfoPage page="about" />} />
          <Route path="privacy" element={<InfoPage page="privacy" />} />
          <Route path="terms" element={<InfoPage page="terms" />} />
          <Route path="disclaimer" element={<InfoPage page="disclaimer" />} />
          <Route path="contact" element={<InfoPage page="contact" />} />

          <Route element={<ProtectedRoute />}>
            <Route path="onboarding" element={<OnboardingPage />} />
          </Route>

          <Route element={<AppShell />}>
            <Route path="deadlines" element={<DeadlinesPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="saved" element={<SavedPage />} />
              <Route path="checklist" element={<ChecklistPage />} />
              <Route path="applications" element={<ApplicationsPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="admin" element={<AdminRoute />}>
            <Route element={<AdminShell />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="schemes" element={<AdminSchemesPage />} />
              <Route path="schemes/new" element={<SchemeEditorPage />} />
              <Route path="schemes/:id/edit" element={<SchemeEditorPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
