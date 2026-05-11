import DialogLoading from '../dialog/DialogLoading.jsx'

function MainLoadingScreen({
  statusLabel = 'Dashboard',
  pageName = '',
  title,
  detail,
}) {
  return (
    <DialogLoading
      eyebrow={statusLabel}
      pageName={pageName}
      loadingLabel={title}
      detail={detail}
    />
  )
}

export default MainLoadingScreen
