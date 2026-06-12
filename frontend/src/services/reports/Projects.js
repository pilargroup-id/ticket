import api from '../api.js'

function normalizeTimelineStatus(status) {
  if (!status) {
    return 'Project'
  }

  return String(status)
    .trim()
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export async function getProjectTimeline(projectId, options = {}) {
  const response = await api.get('/reports/projects/gantt-detail', {
    params: {
      project_id: projectId,
    },
    signal: options.signal,
  })

  const project = response?.data?.project ?? null
  const tasks = Array.isArray(response?.data?.tasks) ? response.data.tasks : []
  const fallbackProjectName = project?.name ?? project?.project_name ?? 'Project'

  const items = tasks.map((task, index) => {
    const isHeaderTask = task?.type === 'header'
    const timestamp = task?.start || task?.end || project?.start || project?.end || null

    return {
      id: task?.id ?? `${projectId}-${index}`,
      status: isHeaderTask
        ? normalizeTimelineStatus(project?.status_label || project?.status)
        : normalizeTimelineStatus(task?.status),
      timestamp,
      title: isHeaderTask ? fallbackProjectName : task?.name ?? `Progress #${index + 1}`,
      detail: isHeaderTask
        ? `Progress project ${task?.progress ?? 0}%`
        : `Progress ${task?.progress ?? 0}%${task?.end ? ` - ${task.end}` : ''}`,
    }
  })

  return {
    message: response?.message ?? '',
    project,
    items,
  }
}
