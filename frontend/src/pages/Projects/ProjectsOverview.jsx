import { useEffect, useMemo, useState } from 'react'

import ButtonRangeDate from '../../components/button/ButtonRangeDate.jsx'
import { Folder } from '../../components/template/TemplateIcons.jsx'
import DialogCreateProjects from '../../components/dialog/DialogCreateProjects.jsx'
import { INITIAL_PROJECT_ROWS } from '../../services/projects/DataTableProjects.js'
import {
  getProjects,
  normalizeProjectStatusCounts,
} from '../../services/projects/Projects.js'
import CardStatusProjects from './CardStatusProjects.jsx'
import DataTableProjects from './DataTableProjects.jsx'

function ProjectsOverview({ activePage, searchQuery }) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [projectRows, setProjectRows] = useState(INITIAL_PROJECT_ROWS)
  const [isLoadingProjects, setIsLoadingProjects] = useState(true)
  const [projectsError, setProjectsError] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  useEffect(() => {
    let isMounted = true

    async function loadProjects() {
      setIsLoadingProjects(true)
      setProjectsError('')

      try {
        const response = await getProjects({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })

        if (!isMounted) {
          return
        }

        setProjectRows(response.data)
      } catch (error) {
        if (!isMounted) {
          return
        }

        setProjectRows([])
        setProjectsError(error?.message || 'Gagal memuat data project.')
      } finally {
        if (isMounted) {
          setIsLoadingProjects(false)
        }
      }
    }

    loadProjects()

    return () => {
      isMounted = false
    }
  }, [dateRange.endDate, dateRange.startDate, refreshTrigger])

  const statusCounts = useMemo(
    () => normalizeProjectStatusCounts(projectRows),
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
          projectRows={projectRows}
          isLoading={isLoadingProjects}
          errorMessage={projectsError}
          onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
          tableLabel={`${activePage?.title ?? 'Projects Overview'} table`}
        />
      </section>

      <DialogCreateProjects
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCreated={() => setRefreshTrigger(prev => prev + 1)}
        eyebrow="Create Project"
        title="Create Projects"
      />
    </>
  )
}

export default ProjectsOverview
