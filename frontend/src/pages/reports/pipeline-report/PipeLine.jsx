import { useEffect, useMemo, useState } from 'react'

import api from '../../../services/api.js'
import { getProjectTimeline } from '../../../services/reports/Projects.js'
import CardStatusPipeline from './CardStatusPipeLine.jsx'
import TimeLineProject from '../../../components/timeline/TimeLineProjectPipeline.jsx'
import {
  buildPipelineProjects,
  buildPipelineStatusCounts,
} from './PipeLineStages.js'

function getVisibleProjects(projects, activeStatus) {
  if (!activeStatus) {
    return projects
  }

  return projects.filter((project) => project.bucket === activeStatus)
}

function PipeLine({ activePage }) {
  const [activeStatus, setActiveStatus] = useState('')
  const [selectedStage, setSelectedStage] = useState('')
  const [projects, setProjects] = useState([])
  const [selectedProjectTimeline, setSelectedProjectTimeline] = useState([])
  const [selectedProjectTimelineMeta, setSelectedProjectTimelineMeta] = useState(null)
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineError, setTimelineError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    async function loadProjects() {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await api.get('/project', { signal: controller.signal })
        const projectList = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : Array.isArray(response?.projects)
              ? response.projects
              : []

        setProjects(projectList)
      } catch (error) {
        if (error?.name === 'AbortError') {
          return
        }

        setProjects([])
        setErrorMessage(error?.message || 'Gagal memuat data project.')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadProjects()

    return () => {
      controller.abort()
    }
  }, [])

  const pipelineProjects = useMemo(() => buildPipelineProjects(projects), [projects])
  const statusCounts = useMemo(
    () => buildPipelineStatusCounts(pipelineProjects),
    [pipelineProjects],
  )
  const visibleProjects = useMemo(
    () => getVisibleProjects(pipelineProjects, activeStatus),
    [activeStatus, pipelineProjects],
  )
  const selectedProject = useMemo(
    () => visibleProjects.find((project) => String(project.id) === String(selectedStage)) || null,
    [selectedStage, visibleProjects],
  )

  useEffect(() => {
    const controller = new AbortController()

    async function loadSelectedProjectTimeline() {
      if (!selectedProject?.id) {
        setSelectedProjectTimeline([])
        setSelectedProjectTimelineMeta(null)
        setTimelineError('')
        setTimelineLoading(false)
        return
      }

      setTimelineLoading(true)
      setTimelineError('')

      try {
        const response = await getProjectTimeline(selectedProject.id, { signal: controller.signal })
        setSelectedProjectTimeline(Array.isArray(response?.items) ? response.items : [])
        setSelectedProjectTimelineMeta(response?.project ?? null)
      } catch (error) {
        if (error?.name === 'AbortError') {
          return
        }

        setSelectedProjectTimeline([])
        setSelectedProjectTimelineMeta(null)
        setTimelineError(error?.message || 'Gagal memuat timeline project.')
      } finally {
        if (!controller.signal.aborted) {
          setTimelineLoading(false)
        }
      }
    }

    loadSelectedProjectTimeline()

    return () => {
      controller.abort()
    }
  }, [selectedProject?.id])

  return (
    <section className="pipeline-report" aria-label="Pipeline report">
      <CardStatusPipeline
        activeStatus={activeStatus}
        onStatusChange={setActiveStatus}
        statusCounts={statusCounts}
      />

      <article className="dashboard-panel pipeline-report__panel" aria-label="Pipeline detail">
        <div className="dashboard-panel__header dashboard-panel__header--split pipeline-report__header">
          <div className="chart-card__header-copy">
            <p className="dashboard-panel__eyebrow">{activePage?.eyebrow ?? 'Reports'}</p>
          </div>
{/* 
          <div className="pipeline-report__legend">
            <span className="pipeline-report__legend-item">
              <span className="pipeline-report__legend-dot pipeline-report__legend-dot--blue" />
              Total
            </span>
            <span className="pipeline-report__legend-item">
              <span className="pipeline-report__legend-dot pipeline-report__legend-dot--green" />
              On track
            </span>
            <span className="pipeline-report__legend-item">
              <span className="pipeline-report__legend-dot pipeline-report__legend-dot--amber" />
              Perhatian
            </span>
          </div> */}
        </div>
        <TimeLineProject
          errorMessage={errorMessage}
          isLoading={isLoading}
          onSelectedStageChange={setSelectedStage}
          selectedProject={selectedProject}
          selectedProjectTimeline={selectedProjectTimeline}
          selectedProjectTimelineMeta={selectedProjectTimelineMeta}
          timelineError={timelineError}
          timelineLoading={timelineLoading}
          selectedStage={selectedStage}
          visibleProjects={visibleProjects}
        />
      </article>
    </section>
  )
}

export default PipeLine
