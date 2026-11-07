import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter } from 'react-router';
import { Spinner } from '@/components/ui/skeleton';
import i18n from '@/i18n';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { BookingPage } from '@/features/public/BookingPage';
import { LandingPage } from '@/pages/LandingPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PrivacyPage } from '@/pages/PrivacyPage';

// O painel é carregado sob demanda: a página pública fica leve no celular.
const ManageBookingPage = lazy(() => import('@/features/manage/ManageBookingPage').then((m) => ({ default: m.ManageBookingPage })));
const SignInPage = lazy(() => import('@/features/auth/SignInPage').then((m) => ({ default: m.SignInPage })));
const SignUpPage = lazy(() => import('@/features/auth/SignUpPage').then((m) => ({ default: m.SignUpPage })));
const ForgotPasswordPage = lazy(() => import('@/features/auth/PasswordPages').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/features/auth/PasswordPages').then((m) => ({ default: m.ResetPasswordPage })));
const PanelRoot = lazy(() => import('@/features/panel/PanelLayout').then((m) => ({ default: m.PanelRoot })));
const OnboardingPage = lazy(() => import('@/features/panel/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const AgendaPage = lazy(() => import('@/features/panel/agenda/AgendaPage').then((m) => ({ default: m.AgendaPage })));
const ClientsPage = lazy(() => import('@/features/panel/clients/ClientsPage').then((m) => ({ default: m.ClientsPage })));
const ClientDetailPage = lazy(() => import('@/features/panel/clients/ClientDetailPage').then((m) => ({ default: m.ClientDetailPage })));
const ServicesPage = lazy(() => import('@/features/panel/services/ServicesPage').then((m) => ({ default: m.ServicesPage })));
const TeamPage = lazy(() => import('@/features/panel/team/TeamPage').then((m) => ({ default: m.TeamPage })));
const AvailabilityPage = lazy(() => import('@/features/panel/availability/AvailabilityPage').then((m) => ({ default: m.AvailabilityPage })));
const UnitsPage = lazy(() => import('@/features/panel/units/UnitsPage').then((m) => ({ default: m.UnitsPage })));
const ReportsPage = lazy(() => import('@/features/panel/reports/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const NotificationsPage = lazy(() => import('@/features/panel/notifications/NotificationsPage').then((m) => ({ default: m.NotificationsPage })));
const SettingsPage = lazy(() => import('@/features/panel/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })));

const page = (node: ReactNode) => <Suspense fallback={<Spinner className="min-h-[50dvh]" label={i18n.t('common.loading')} />}>{node}</Suspense>;

export const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/entrar', element: page(<SignInPage />) },
  { path: '/cadastro', element: page(<SignUpPage />) },
  { path: '/recuperar-senha', element: page(<ForgotPasswordPage />) },
  { path: '/redefinir-senha', element: page(<ResetPasswordPage />) },
  { path: '/privacidade', element: <PrivacyPage /> },
  { path: '/r/:token', element: page(<ManageBookingPage />) },
  {
    path: '/painel',
    element: <RequireAuth>{page(<PanelRoot />)}</RequireAuth>,
    children: [
      { index: true, element: page(<AgendaPage />) },
      { path: 'novo-negocio', element: page(<OnboardingPage />) },
      { path: 'clientes', element: page(<ClientsPage />) },
      { path: 'clientes/:id', element: page(<ClientDetailPage />) },
      { path: 'servicos', element: page(<ServicesPage />) },
      { path: 'equipe', element: page(<TeamPage />) },
      { path: 'disponibilidade', element: page(<AvailabilityPage />) },
      { path: 'unidades', element: page(<UnitsPage />) },
      { path: 'relatorios', element: page(<ReportsPage />) },
      { path: 'notificacoes', element: page(<NotificationsPage />) },
      { path: 'configuracoes', element: page(<SettingsPage />) },
    ],
  },
  { path: '/:slug', element: <BookingPage /> },
  { path: '/:slug/:unitSlug', element: <BookingPage /> },
  { path: '*', element: <NotFoundPage /> },
]);
