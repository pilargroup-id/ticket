import {
  FileText01,
  LayoutDashboard,
  LogOutLeft01,
  Ticket01,
  Table01,
  Chart01,
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
  '/Table',
  '/TableActions',
  '/users',
  '/Chart',
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
    id: 'table',
    label: 'Table',
    icon: Table01,
    children: [
      {
        id: 'table-data',
        label: 'Data Table',
        href: '/Table',
      },
      {
        id: 'table-users',
        label: 'Data Table Actions',
        href: '/TableActions',
      },
    ],
  },
  {
    id: 'chart',
    label: 'Chart',
    href: '/Chart',
    icon: Chart01,
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
