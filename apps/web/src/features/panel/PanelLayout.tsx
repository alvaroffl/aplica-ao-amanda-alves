import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronsUpDown,
  Clock,
  Copy,
  ExternalLink,
  LogOut,
  Menu,
  Plus,
  Scissors,
  Settings,
  Users,
  UsersRound,
} from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router';
import { toast } from 'sonner';
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';
import { Logo } from '@/components/common/Logo';
import { ErrorState } from '@/components/common/States';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/skeleton';
import { publicUrl } from '@/lib/env';
import { cn, copyText, initials } from '@/lib/utils';
import { useAuth } from '@/providers/auth';
import { BusinessProvider, useBusiness, useMemberships, type Permission } from './business';
import { useRealtimeBookings } from './realtime';

interface NavItem {
  to: string;
  label: string;
  icon: typeof CalendarDays;
  permission?: Permission;
  end?: boolean;
}

export function PanelRoot() {
  const { t } = useTranslation();
  const memberships = useMemberships();
  const location = useLocation();
  if (memberships.isPending) return <Spinner className="min-h-dvh" label={t('common.loading')} />;
  if (memberships.isError)
    return (
      <ErrorState
        className="m-6"
        error={memberships.error}
        onRetry={() => void memberships.refetch()}
      />
    );
  if (memberships.data.length === 0 || location.pathname === '/painel/novo-negocio') {
    if (location.pathname !== '/painel/novo-negocio')
      return <Navigate to="/painel/novo-negocio" replace />;
    return <Outlet />;
  }
  return (
    <BusinessProvider memberships={memberships.data}>
      <PanelShell />
    </BusinessProvider>
  );
}

function PanelShell() {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const location = useLocation();
  useRealtimeBookings();

  React.useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-dvh bg-muted/30 lg:grid lg:grid-cols-[260px_minmax(0,1fr)]">
      <a href="#conteudo" className="skip-link">
        {t('common.skipToContent')}
      </a>
      <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-card lg:flex">
        <Sidebar />
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card/95 px-3 backdrop-blur lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(true)}
          aria-label={t('panel.openMenu')}
        >
          <Menu aria-hidden />
        </Button>
        <Logo to="/painel" />
        <ThemeToggle />
      </header>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          side="right"
          className="left-0 right-auto max-w-[280px] p-0 data-[state=open]:slide-in-from-left sm:rounded-none sm:rounded-r-2xl"
        >
          <DialogTitle className="sr-only">{t('panel.menu')}</DialogTitle>
          <Sidebar />
        </DialogContent>
      </Dialog>

      <main id="conteudo" className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}

function Sidebar() {
  const { t } = useTranslation();
  const { business, memberships, role, can, switchBusiness } = useBusiness();
  const { user, signOut } = useAuth();
  const link = publicUrl(`/${business.slug}`);

  const items: NavItem[] = [
    { to: '/painel', label: t('panel.nav.agenda'), icon: CalendarDays, end: true },
    { to: '/painel/clientes', label: t('panel.nav.clients'), icon: UsersRound },
    { to: '/painel/disponibilidade', label: t('panel.nav.availability'), icon: Clock },
    {
      to: '/painel/servicos',
      label: t('panel.nav.services'),
      icon: Scissors,
      permission: 'services.manage',
    },
    { to: '/painel/equipe', label: t('panel.nav.team'), icon: Users, permission: 'team.manage' },
    {
      to: '/painel/unidades',
      label: t('panel.nav.units'),
      icon: Building2,
      permission: 'units.manage',
    },
    {
      to: '/painel/relatorios',
      label: t('panel.nav.reports'),
      icon: BarChart3,
      permission: 'reports.view',
    },
    {
      to: '/painel/notificacoes',
      label: t('panel.nav.notifications'),
      icon: Bell,
      permission: 'notifications.view',
    },
    {
      to: '/painel/configuracoes',
      label: t('panel.nav.settings'),
      icon: Settings,
      permission: 'settings.manage',
    },
  ].filter((i) => !i.permission || can(i.permission as Permission)) as NavItem[];

  const copyLink = async () => {
    try {
      await copyText(link);
      toast.success(t('panel.linkCopied'));
    } catch {
      toast.error(t('errors.INTERNAL_ERROR'));
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center border-b px-4">
        <Logo to="/painel" />
      </div>

      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg border bg-background p-2 text-left text-sm hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
            >
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
                aria-hidden
              >
                {initials(business.name)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{business.name}</span>
                <span className="block text-xs text-muted-foreground">{t(`roles.${role}`)}</span>
              </span>
              <ChevronsUpDown className="size-4 text-muted-foreground" aria-hidden />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel>{t('panel.businesses')}</DropdownMenuLabel>
            {memberships.map((m) => (
              <DropdownMenuItem key={m.business.id} onSelect={() => switchBusiness(m.business.id)}>
                <span className="flex-1 truncate">{m.business.name}</span>
                {m.business.id === business.id && <Check aria-hidden />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/painel/novo-negocio">
                <Plus aria-hidden /> {t('panel.newBusiness')}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav aria-label={t('panel.menu')} className="flex-1 overflow-y-auto px-3">
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )
                }
              >
                <item.icon className="size-4" aria-hidden />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-2 border-t p-3">
        <div className="rounded-lg bg-accent/60 p-3">
          <p className="text-xs font-medium text-muted-foreground">{t('panel.publicPage')}</p>
          <p className="truncate text-sm font-medium">{link.replace(/^https?:\/\//, '')}</p>
          <div className="mt-2 flex gap-1">
            <Button size="sm" variant="outline" className="h-8 flex-1" onClick={copyLink}>
              <Copy aria-hidden /> {t('common.copy')}
            </Button>
            <Button size="sm" variant="outline" className="h-8" asChild>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                aria-label={t('panel.openPublicPage')}
              >
                <ExternalLink aria-hidden />
              </a>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between gap-1">
          <span className="min-w-0 truncate px-1 text-xs text-muted-foreground">{user?.email}</span>
          <div className="flex shrink-0">
            <LanguageSwitcher />
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void signOut()}
              aria-label={t('common.signOut')}
            >
              <LogOut aria-hidden />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
