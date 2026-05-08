import { useState, useMemo } from "react";
import "../../styles/DataCardMobile.css";

const ITEMS_PER_PAGE = 5;

export default function DataCardMobile({
  columns,
  data,
  renderActionsMobile,
  onRefresh,
  add,
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");

  const hasActions = columns.some((c) => c.data === "actions");

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row) =>
      columns.some((col) => {
        if (col.data === "actions") return false;
        const value = row[col.data];
        return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [data, columns, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = currentPage * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(0);
  };

  const isEmpty = paginatedData.length === 0;
  const isSearching = !!searchTerm;

  return (
    <div className="dtm-wrap">
      {/* Search + Actions */}
      <div className="dtm-toolbar">
        <div className="dtm-search">
          <input
            type="text"
            placeholder="Search…"
            value={searchTerm}
            onChange={handleSearchChange}
            className="dtm-search-input"
          />
          {searchTerm ? (
            <button
              type="button"
              className="dtm-clear"
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(0);
              }}
              aria-label="Clear search"
              title="Clear"
            >
              ×
            </button>
          ) : null}
        </div>

        <div className="dtm-actions">
          {add ? (
            <button onClick={add} className="dtm-btn dtm-btn-primary">
              Add
            </button>
          ) : null}

          {onRefresh ? (
            <button onClick={onRefresh} className="dtm-btn dtm-btn-ghost">
              Refresh
            </button>
          ) : null}
        </div>
      </div>

      {/* Cards */}
      {!isEmpty ? (
        paginatedData.map((row, i) => (
          <div key={row?.id ?? i} className="dtm-card">
            <div className="dtm-card-body">
              {columns
                .filter((c) => c.data !== "actions")
                .map((col, j) => (
                  <div key={j} className="dtm-row">
                    <div className="dtm-label">{col.title}</div>
                    <div className="dtm-value">{row[col.data] ?? "-"}</div>
                  </div>
                ))}
            </div>

            {hasActions ? (
              <div className="dtm-card-actions">
                {renderActionsMobile ? renderActionsMobile(row) : null}
              </div>
            ) : null}
          </div>
        ))
      ) : (
        <div className="dtm-empty">
          <div className="dtm-empty-title">
            {isSearching ? "No results" : "No data"}
          </div>
          <div className="dtm-empty-desc">
            {isSearching ? "Coba kata kunci lain atau clear search." : "Belum ada data yang bisa ditampilkan."}
          </div>

      
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 ? (
        <div className="dtm-pagination">
          <button
            className="dtm-page-btn"
            disabled={currentPage === 0}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </button>

          <span className="dtm-page-label">
            {currentPage + 1} / {totalPages}
          </span>

          <button
            className="dtm-page-btn"
            disabled={currentPage >= totalPages - 1}
            onClick={() => setCurrentPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
