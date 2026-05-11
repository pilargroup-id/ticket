import { useMemo, useState } from 'react'

import ButtonRangeDate from '../../components/button/ButtonRangeDate.jsx'
import { Folder } from '../../components/template/TemplateIcons.jsx'
import DialogCreateProjects from '../../components/dialog/DialogCreateProjects.jsx'
import CardStatusProjects from './CardStatusProjects.jsx'
import DataTableProjects from './DataTableProjects.jsx'

const INITIAL_PROJECT_ROWS = [
  {
    id: 'PRJ-001',
    ticketCode: 'PRJ-001',
    category: 'Infrastructure',
    requestor: 'IT Operations',
    problem: 'Rollout self-service portal untuk request layanan internal.',
    requestDate: '11 Mei 2026',
    requestDateValue: '2026-05-11T09:00:00+07:00',
    status: 'In Progress',
    priority: 'High',
    supportName: 'Alya Pratama',
    solution: 'Discovery selesai dan backlog sprint pertama sudah disetujui.',
  },
  {
    id: 'PRJ-002',
    ticketCode: 'PRJ-002',
    category: 'Security',
    requestor: 'Information Security',
    problem: 'Implementasi approval flow untuk privileged access lintas aplikasi.',
    requestDate: '09 Mei 2026',
    requestDateValue: '2026-05-09T10:30:00+07:00',
    status: 'Waiting',
    priority: 'High',
    supportName: 'Bima Saputra',
    solution: 'Menunggu final scope dan daftar sistem yang masuk fase pertama.',
  },
  {
    id: 'PRJ-003',
    ticketCode: 'PRJ-003',
    category: 'Automation',
    requestor: 'Finance',
    problem: 'Otomasi notifikasi SLA untuk approval invoice dan eskalasi review.',
    requestDate: '07 Mei 2026',
    requestDateValue: '2026-05-07T14:00:00+07:00',
    status: 'Resolved',
    priority: 'Medium',
    supportName: 'Clara Wijaya',
    solution: 'Workflow notifikasi aktif di staging dan siap dipromosikan ke produksi.',
  },
  {
    id: 'PRJ-004',
    ticketCode: 'PRJ-004',
    category: 'Integration',
    requestor: 'HRIS Team',
    problem: 'Sinkronisasi master user antara HRIS dan aplikasi ticketing.',
    requestDate: '06 Mei 2026',
    requestDateValue: '2026-05-06T13:15:00+07:00',
    status: 'Feedback',
    priority: 'Medium',
    supportName: 'Dio Mahendra',
    solution: 'Menunggu konfirmasi mapping field dari tim HRIS.',
  },
]

function ProjectsOverview({ activePage, searchQuery }) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [projectRows, setProjectRows] = useState(INITIAL_PROJECT_ROWS)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })

  const statusCounts = useMemo(
    () =>
      projectRows.reduce((counts, project) => {
        counts[project.status] = (counts[project.status] ?? 0) + 1
        return counts
      }, {}),
    [projectRows],
  )

  return (
    <>
      <CardStatusProjects
        activeStatus={statusFilter}
        onStatusChange={setStatusFilter}
        statusCounts={statusCounts}
      />

      <section
        className="dashboard-panel users-table-card mytickets-table-card"
        aria-label="Aktivitas legal"
      >
        <div className="users-table-card__header mytickets-table-card__header">
          <div className="mytickets-table-card__title-group">
            <h1 className="dashboard-panel__title mytickets-table-card__title">
              {activePage?.title ?? 'Projects Overview'}
            </h1>
          </div>

          <div className="users-table-card__actions">
            <ButtonRangeDate label="Request Date" onChange={setDateRange} />

            <button
              type="button"
              className="users-table-card__action"
              onClick={() => setIsCreateDialogOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={isCreateDialogOpen}
            >
              <Folder size={18} aria-hidden="true" />
              <span>Create Projects</span>
            </button>
          </div>
        </div>

        <DataTableProjects
          dateRange={dateRange}
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          ticketRows={projectRows}
          setTicketRows={setProjectRows}
          tableLabel={`${activePage?.title ?? 'Projects Overview'} table`}
        />
      </section>

      <DialogCreateProjects
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        eyebrow="Create Project"
        title="Create Projects"
      />
    </>
  )
}

export default ProjectsOverview
