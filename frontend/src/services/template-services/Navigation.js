import {
  FileText01,
  LayoutDashboard,
  LogOutLeft01,
  Ticket01,
  Folder,
  TrendingUp,
} from '../../components/template/TemplateIcons.jsx'

export const defaultNavigationPath = '/dashboard'

export const implementedNavigationPaths = [
  '/MyTickets',
  '/TicketsOverview',
  '/ProjectsOverview',
  '/Reports',
  '/Reports/TeamPerformance',
  '/Reports/ExecutiveInsights',
  '/Reports/ProjectPerformance',
  '/Master',
  '/Master/Category',
]

export const primaryNavigationItems = [
  {
    id: 'my-tickets',
    label: 'My Tickets',
    href: '/MyTickets',
    icon: Ticket01,
  },
  {
    id: 'tickets-overview',
    label: 'Tickets Overview',
    href: '/TicketsOverview',
    icon: TrendingUp,
  },
  {
    id: 'projects-overview',
    label: 'Projects Overview',
    href: '/ProjectsOverview',
    icon: Folder,
  },
  {
    id: 'reports',
    label: 'Reports',
    href: '/Reports',
    icon: FileText01,
    children: [
      {
        id: 'team-performance',
        label: 'Team Performance',
        href: '/Reports/TeamPerformance',
      },
      {
        id: 'executive-insight',
        label: 'Executive Insight',
        href: '/Reports/ExecutiveInsights',
      },
      {
        id: 'project-performance',
        label: 'Project Performance',
        href: '/Reports/ProjectPerformance',
      }
    ]
  },
  {
    id: 'master',
    label: 'Master',
    icon: LayoutDashboard,
    children: [
      {
        id: 'master-category',
        label: 'Category',
        href: '/Master/Category',
      },
    ],
  }
]

export const secondaryNavigationItems = [
  {
    id: 'back-pilargroup',
    label: 'Back Pilargroup',
    href: 'https://pilargroup.id/dashboard',
    icon: LogOutLeft01,
    external: true,
  },
]
