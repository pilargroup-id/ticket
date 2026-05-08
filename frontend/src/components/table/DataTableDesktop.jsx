import React, { useState, useMemo } from "react";
import DataTable from "react-data-table-component";
import "../../styles/DataTableDesktop.css";

export default function DataTableDesktop({
  columns,
  data,
  renderActions,
  onRefresh,
  add,
  addLabel = "Add",
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // ===== FILTER =====
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row) =>
      columns.some((col) => {
        if (col.data === "actions") return false;
        return row[col.data]
          ?.toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      })
    );
  }, [data, columns, searchTerm]);

  // ===== COLUMNS =====
  const desktopColumns = columns.map((col) => ({
    name: col.title,
    selector: col.data !== "actions" ? (row) => row[col.data] ?? "-" : undefined,
    cell: col.data === "actions" ? (row) => renderActions?.(row) : undefined,
    sortable: col.data !== "actions",
    wrap: true,
  }));

  const SubHeaderComponent = (
    <div className="dt-subheader">
      <div className="dt-search">
        <input
          type="text"
          placeholder="Search…"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="dt-search-input"
        />
        {searchTerm ? (
          <button
            type="button"
            className="dt-clear"
            onClick={() => setSearchTerm("")}
            aria-label="Clear search"
            title="Clear"
          >
            ×
          </button>
        ) : null}
      </div>

      <div className="dt-actions">
        {add && (
          <button onClick={add} className="dt-btn dt-btn-primary">
            {addLabel}
          </button>
        )}
        {onRefresh && (
          <button onClick={onRefresh} className="dt-btn dt-btn-ghost">
            Refresh
          </button>
        )}
      </div>
    </div>
  );

  const isEmpty = !filteredData || filteredData.length === 0;
  const isSearching = !!searchTerm;

  const NoData = (
    <div className="dt-empty">
      <div className="dt-empty-title">
        {isSearching ? "No results" : "No data"}
      </div>
      <div className="dt-empty-desc">
        {isSearching
          ? "Coba kata kunci lain atau clear search." : "Belum ada data yang bisa ditampilkan."}
      </div>

    </div>
  );

  const customStyles = {
    headRow: {
      style: {
        minHeight: "44px",
        borderBottom: "1px solid rgba(17,24,39,0.08)",
        backgroundColor: "rgba(17,24,39,0.02)",
      },
    },
    headCells: {
      style: {
        fontWeight: 800,
        fontSize: "12px",
        color: "rgba(17,24,39,0.70)",
      },
    },
    rows: {
      style: {
        minHeight: "52px",
        borderBottom: "1px solid rgba(17,24,39,0.06)",
        backgroundColor: "#fff",
      },
    },
    cells: {
      style: {
        fontSize: "14px",
        fontWeight: 600,
        color: "rgba(17,24,39,0.88)",
      },
    },
    pagination: {
      style: {
        borderTop: "1px solid rgba(17,24,39,0.08)",
        backgroundColor: "#fff",
      },
    },
  };

  return (
    <div className="dt-wrap">
      <DataTable
        columns={desktopColumns}
        data={filteredData}
        pagination
        highlightOnHover
        responsive
        striped
        subHeader
        subHeaderComponent={SubHeaderComponent}
        noDataComponent={NoData}
        customStyles={customStyles}
        className="dt-table"
      />
      {isEmpty ? <div className="dt-bottom-pad" /> : null}
    </div>
  );
}
