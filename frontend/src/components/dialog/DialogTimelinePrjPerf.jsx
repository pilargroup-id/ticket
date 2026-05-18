import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

import { XClose } from '../template/TemplateIcons.jsx'
import TimeLineMT from '../timeline/TimeLineMT.jsx'
import { getDeveloperProjects } from '../../services/reports/DeveloperReports.js'

function DialogTimelinePrjPerf({
  isOpen = false,
  developerId = null,
  year = '2026',
  status = 'all',
  eyebrow = 'Dialog',
  title = 'Timeline',
  onClose,
}) {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!isOpen || !developerId) {
      setItems([])
      return
    }

    async function fetchTimeline() {
      console.log('Fetching timeline for developerId:', developerId)
      setIsLoading(true)
      try {
        const response = await getDeveloperProjects(developerId, { year, status })
        console.log('API Response:', response)
        // Flatten tasks from all projects into a single timeline
        const timelineEntries = []
        
        response.data.forEach(prj => {
          // Helper to normalize status for TimeLineMT (e.g., "resolved" -> "Resolved")
          const formatStatus = (s) => {
            if (!s) return 'Unknown'
            return s.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
          }

          if (prj.tasks && prj.tasks.length > 0) {
            prj.tasks.forEach(task => {
              timelineEntries.push({
                id: `task-${task.id}`,
                status: formatStatus(task.status || prj.status),
                timestamp: task.progress_date,
                title: prj.project_name,
                detail: task.description || `Progress: ${task.progress_percent}%`
              })
            })
          } else {
            // Fallback to project summary if no tasks
            timelineEntries.push({
              id: `prj-${prj.project_id}`,
              status: formatStatus(prj.status),
              timestamp: prj.last_progress_date || prj.end_date || prj.start_date,
              title: prj.project_name,
              detail: `Progress: ${prj.progress_percent}% - ${prj.tasks_count} Tasks (No detailed activity)`
            })
          }
        })

        // Sort by timestamp descending (newest first)
        const sortedItems = timelineEntries.sort((a, b) => {
          const dateA = new Date(a.timestamp)
          const dateB = new Date(b.timestamp)
          return dateB - dateA
        })

        setItems(sortedItems)
      } catch (error) {
        console.error('Failed to fetch developer projects:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTimeline()
  }, [isOpen, developerId, year, status])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  if (typeof document === 'undefined') {
    return null
  }

  const dialogNode = (
    <div className="dashboard-popup-overlay" role="presentation" onClick={onClose}>
      <div
        className="dashboard-popup mtickets-timeline-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-timeline-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dashboard-popup__header">
          <div>
            <p className="dashboard-popup__eyebrow">{eyebrow}</p>
            <h2 className="dashboard-popup__title" id="dialog-timeline-title">
              {title}
            </h2>
          </div>

          <button
            type="button"
            className="dashboard-popup__close"
            aria-label="Tutup dialog"
            onClick={onClose}
          >
            <XClose size={18} />
          </button>
        </div>

        <div className="dashboard-popup__body mtickets-timeline-popup__body">
          <TimeLineMT 
            items={items} 
            emptyMessage={isLoading ? 'Memuat data timeline...' : 'Belum ada data project untuk developer ini.'}
          />
        </div>
      </div>
    </div>
  )

  return createPortal(dialogNode, document.body)
}

export default DialogTimelinePrjPerf
