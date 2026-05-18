import { useEffect, useState } from 'react'
import DataTableMCategory from './DataTableMCategory.jsx'
import api from '../../../services/api.js'

function MasterCategory() {
  const [categories, setCategories] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function fetchCategories() {
      setIsLoading(true)
      try {
        const response = await api.get('/user/category')
        if (isMounted) {
          setCategories(response.data || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Gagal memuat kategori')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchCategories()

    return () => {
      isMounted = false
    }
  }, [])

  const columns = [
    {
      key: 'id',
      header: 'ID',
      cellStyle: { width: '5%', whiteSpace: 'nowrap' },
      render: (row) => row.id,
    },
    {
      key: 'name',
      header: 'Category Name',
      render: (row) => row.name,
    },
  ]

  return (
    <section className="dashboard-panel users-table-card">
      <div className="users-table-card__header">
        <h1 className="dashboard-panel__title">Master Category</h1>
      </div>
      <DataTableMCategory
        columns={columns}
        rows={categories}
        isLoading={isLoading}
        errorMessage={error}
        emptyMessage="Tidak ada data kategori."
      />
    </section>
  )
}

export default MasterCategory
