import { useEffect, useMemo, useState } from 'react'

import api from '../../../services/api.js'
import { getProjectTimeline } from '../../../services/reports/Projects.js'
import CardStatusPipeline from './CardStatusPipeLine.jsx'
import TimeLineProject from '../../../components/timeline/TimeLineProjectPipeline.jsx'
import {
  buildPipelineProjects,
  buildPipelineStatusCounts,
} from './PipeLineStages.js'

function matchesPipelineSearch(project, searchQuery) {
  const query = searchQuery.trim().toLowerCase()

  if (!query) {
    return true
  }

  return [
    project.title,
    project.code,
    project.description,
    project.owner,
    project.category,
    project.statusLabel,
    project.bucket,
    project.periodLabel,
    project.detail,
  ].some((value) => String(value ?? '').toLowerCase().includes(query))
}

function getVisibleProjects(projects, activeStatus) {
  if (!activeStatus || activeStatus === 'Total Project') {
    return projects
  }

  return projects.filter((project) => project.bucket === activeStatus)
}

function compareCompletionState(leftItem, rightItem) {
  const leftIsDone = leftItem.bucket === 'Done'
  const rightIsDone = rightItem.bucket === 'Done'

  if (leftIsDone !== rightIsDone) {
    return leftIsDone ? 1 : -1
  }

  return 0
}

function getSortedProjects(projects, sortMode) {
  const list = [...projects]

  switch (sortMode) {
    case 'progress-desc':
      return list.sort((leftItem, rightItem) => {
        const completionOrder = compareCompletionState(leftItem, rightItem)
        if (completionOrder !== 0) {
          return completionOrder
        }

        return rightItem.progress - leftItem.progress
      })
    case 'progress-asc':
      return list.sort((leftItem, rightItem) => {
        const completionOrder = compareCompletionState(leftItem, rightItem)
        if (completionOrder !== 0) {
          return completionOrder
        }

        return leftItem.progress - rightItem.progress
      })
    case 'date-desc':
      return list.sort((leftItem, rightItem) => {
        const completionOrder = compareCompletionState(leftItem, rightItem)
        if (completionOrder !== 0) {
          return completionOrder
        }

        return String(rightItem.rawStartDate || rightItem.rawEndDate || '').localeCompare(
          String(leftItem.rawStartDate || leftItem.rawEndDate || ''),
        )
      })
    case 'date-asc':
      return list.sort((leftItem, rightItem) => {
        const completionOrder = compareCompletionState(leftItem, rightItem)
        if (completionOrder !== 0) {
          return completionOrder
        }

        return String(leftItem.rawStartDate || leftItem.rawEndDate || '').localeCompare(
          String(rightItem.rawStartDate || rightItem.rawEndDate || ''),
        )
      })
    default:
      return list.sort((leftItem, rightItem) => {
        const completionOrder = compareCompletionState(leftItem, rightItem)
        if (completionOrder !== 0) {
          return completionOrder
        }

        return rightItem.progress - leftItem.progress
      })
  }
}

function PipeLine({ activePage, searchQuery = '' }) {
  const [activeStatus, setActiveStatus] = useState('')
  const [selectedStage, setSelectedStage] = useState('')
  const [sortMode, setSortMode] = useState('default')
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
  const searchedProjects = useMemo(
    () => pipelineProjects.filter((project) => matchesPipelineSearch(project, searchQuery)),
    [pipelineProjects, searchQuery],
  )
  const visibleProjects = useMemo(
    () => getVisibleProjects(searchedProjects, activeStatus),
    [activeStatus, searchedProjects],
  )
  const filteredProjects = useMemo(() => {
    const projectsToFilter = getSortedProjects(visibleProjects, sortMode)
    return projectsToFilter
  }, [sortMode, visibleProjects])
  const effectiveSelectedStage = useMemo(() => {
    const selectedExists = filteredProjects.some(
      (project) => String(project.id) === String(selectedStage),
    )

    if (selectedExists) {
      return selectedStage
    }

    return filteredProjects[0]?.id ?? ''
  }, [filteredProjects, selectedStage])
  const selectedProject = useMemo(
    () =>
      filteredProjects.find((project) => String(project.id) === String(effectiveSelectedStage)) ||
      null,
    [effectiveSelectedStage, filteredProjects],
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
          onSortModeChange={setSortMode}
          selectedProject={selectedProject}
          selectedProjectTimeline={selectedProjectTimeline}
          selectedProjectTimelineMeta={selectedProjectTimelineMeta}
          timelineError={timelineError}
          timelineLoading={timelineLoading}
          selectedStage={effectiveSelectedStage}
          sortMode={sortMode}
          visibleProjects={filteredProjects}
          searchQuery={searchQuery}
        />
      </article>
    </section>
  )
}

export default PipeLine
