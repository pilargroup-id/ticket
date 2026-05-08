import React, { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "../navigation/Sidebar";
import BottomNav from "../navigation/BottomNav";
import Header from "../navigation/Header";
import HeaderCard from "../navigation/HeaderCard";
import PageTransition from "../animation/Transition";
import FormModal from "../form/FormModal";
import "../../styles/DashboardLayout.css";

import CategoryService from "../../services/CategoriesService";
import TicketService from "../../services/TicketService";

const DashboardLayout = () => {
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // ✅ reusable modal manager
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalFields, setModalFields] = useState([]);
  const [modalOnSubmit, setModalOnSubmit] = useState(() => async () => {});
  const [form, setForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // ✅ error handling (Laravel 422)
  const [formErrors, setFormErrors] = useState({});
  const [submitError, setSubmitError] = useState("");

  // ✅ categories
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarCollapsed((prev) => !prev);

useEffect(() => {
  const fetchCategories = async () => {
    try {
      const data = await CategoryService.show();

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];

      setCategories(list);
    } catch (err) {
      // Silently handle category fetch error - not critical for page load
      console.warn("Category fetch warning:", err?.response?.status || err?.message);
      setCategories([]);
    }
  };

  fetchCategories();
}, []);


  // ✅ open modal generic (dipakai semua halaman kalau butuh)
  const openFormModal = useCallback(({ title, fields, initialForm = {}, onSubmit }) => {
    setModalTitle(title);
    setModalFields(fields);
    setForm(initialForm);
    setFormErrors({});
    setSubmitError("");
    setModalOnSubmit(() => onSubmit);
    setModalOpen(true);
  }, []);

  const closeFormModal = useCallback(() => {
    if (submitting) return;
    setModalOpen(false);
    setFormErrors({});
    setSubmitError("");
  }, [submitting]);

  // ✅ universal submit handler + Laravel 422 errors
  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    try {
      setSubmitting(true);
      setFormErrors({});
      setSubmitError("");

      await modalOnSubmit(form);

      setModalOpen(false);
      setForm({});
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;

      if (status === 422) {
        setFormErrors(data?.errors || {});
        setSubmitError(data?.message || "Validasi gagal. Cek input kamu.");
        return;
      }

      setSubmitError(data?.message || error?.message || "Terjadi kesalahan.");
      console.error("Gagal submit modal:", error);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, modalOnSubmit, form]);

  // ✅ TICKET FIELDS (Create Ticket by user)
  const ticketFields = useMemo(
    () => [
      {
        type: "select",
        name: "category_id",
        placeholder: "Pilih Kategori",
        options: (categories || []).map((c) => ({
          label: c.name,
          value: String(c.id),
        })),
      },
      { type: "input", name: "nama_pembuat", placeholder: "Nama Pembuat" },
      { type: "input", name: "problem", placeholder: "Masalah" },
      { type: "file", name: "image", placeholder: "Lampiran (opsional)" },
    ],
    [categories]
  );

  // ✅ OPEN CREATE TICKET MODAL (ini yang dipakai BottomNav)
  const openTicketModal = useCallback(() => {
    openFormModal({
      title: "Tambah Ticket",
      fields: ticketFields,
      initialForm: {
        category_id: "",
        nama_pembuat: "",
        problem: "",
        image: null,
      },
      onSubmit: async (formData) => {
        // ✅ sesuai TicketService.storeByUser(form)
        await TicketService.storeByUser(formData);
      },
    });
  }, [openFormModal, ticketFields]);

  return (
    <div className={`dashboard-layout ${isMobile ? "is-mobile" : "is-desktop"}`}>
      {!isMobile && <Sidebar collapsed={sidebarCollapsed} />}

      <div className={`dashboard-content ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        {!isMobile && (
          <Header sidebarCollapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
        )}

        <div className="dashboard-container">
          {isMobile && <HeaderCard />}

          <div className="dashboard-content-wrapper">
            <PageTransition key={location.pathname}>
              <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
                <Outlet
                  context={{
                    openFormModal,
                    openTicketModal, // ✅ biar page lain bisa panggil juga
                  }}
                />
              </Suspense>
            </PageTransition>
          </div>
        </div>
      </div>

      {/* ✅ BottomNav FAB: selalu CREATE TICKET */}
      {isMobile && <BottomNav openModal={openTicketModal} />}

      {/* ✅ FormModal (desktop center, mobile bottom sheet) */}
      <FormModal
        open={modalOpen}
        onClose={closeFormModal}
        fields={modalFields}
        form={form}
        setForm={setForm}
        onSubmit={handleSubmit}
        submitting={submitting}
        title={modalTitle}
        errors={formErrors}
        submitError={submitError}
      />
    </div>
  );
};

export default DashboardLayout;
