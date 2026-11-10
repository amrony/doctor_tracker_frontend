"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { Icon } from "@/app/components/ui-icon";
import { PatientCreateModal, type PatientRecord } from "./patient-create-modal";
import type { DoctorRecord } from "../../doctor-create-modal";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Props = {
  doctorId: string;
};

export function DoctorPatientsView({ doctorId }: Props) {
  const [doctor, setDoctor] = useState<DoctorRecord | null>(null);
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [conditionFilter, setConditionFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loadingPatients, setLoadingPatients] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  // Load Doctor Profile
  useEffect(() => {
    async function loadDoctor() {
      try {
        const response = await fetch(`/api/doctors/${doctorId}`);
        if (!response.ok) {
          throw new Error("Unable to locate doctor record.");
        }
        const json = await response.json();
        setDoctor(json.data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Doctor record not found.");
      }
    }
    loadDoctor();
  }, [doctorId]);

  // Fetch Patients
  const fetchPatients = useCallback(
    async (targetPage = 1, targetLimit = pagination.limit) => {
      setLoadingPatients(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("limit", String(targetLimit));

      if (search.trim()) params.set("q", search.trim());
      if (conditionFilter.trim()) params.set("condition", conditionFilter.trim());
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      try {
        const response = await fetch(
          `/api/doctors/${doctorId}/patients?${params.toString()}`,
        );
        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.message || "Failed to load patient records.");
        }

        const json = await response.json();
        setPatients(json.data || []);
        if (json.pagination) {
          setPagination(json.pagination);
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unable to load patient records.");
      } finally {
        setLoadingPatients(false);
      }
    },
    [doctorId, search, conditionFilter, fromDate, toDate, pagination.limit],
  );

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      startTransition(() => {
        fetchPatients(1);
      });
    }, 280);

    return () => clearTimeout(debounceTimer);
  }, [search, conditionFilter, fromDate, toDate, fetchPatients]);

  function showToast(message: string, type: "success" | "error" = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleDeletePatient(patient: PatientRecord) {
    if (!confirm(`Are you sure you want to remove patient "${patient.name}" from this doctor's list?`)) {
      return;
    }

    setDeletingId(patient._id);
    try {
      const response = await fetch(`/api/doctors/${doctorId}/patients/${patient._id}`, {
        method: "DELETE",
      });

      if (response.status === 204 || response.ok) {
        showToast(`Patient "${patient.name}" has been removed.`);
        fetchPatients(pagination.page);
      } else {
        const errJson = await response.json().catch(() => null);
        showToast(errJson?.message || "Failed to delete patient.", "error");
      }
    } catch {
      showToast("Network error while deleting patient.", "error");
    } finally {
      setDeletingId(null);
    }
  }

  function handleResetFilters() {
    setSearch("");
    setConditionFilter("");
    setFromDate("");
    setToDate("");
  }

  const hasActiveFilters = Boolean(search || conditionFilter || fromDate || toDate);

  return (
    <>
      <Link className="back-link" href="/doctors">
        <Icon name="arrow-left" size={16} />
        Back to Doctors Directory
      </Link>

      {/* Doctor Info Card */}
      {doctor && (
        <section className="doctor-profile-card">
          <div className="doctor-profile-details">
            <div className="avatar-initials" style={{ width: 48, height: 48, fontSize: 18 }}>
              {doctor.name
                .replace(/^Dr\.\s*/i, "")
                .split(" ")
                .map((n) => n[0])
                .slice(0, 2)
                .join("")
                .toUpperCase() || "DR"}
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ margin: 0, fontSize: "clamp(22px, 3vw, 28px)", fontWeight: 750 }}>
                  {doctor.name}
                </h1>
                <span className="badge">{doctor.specialization}</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 6, flexWrap: "wrap", fontSize: 13, color: "var(--muted)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="hospital" size={15} />
                  {doctor.hospital}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="phone" size={14} />
                  {doctor.phone}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Icon name="mail" size={14} />
                  {doctor.email}
                </span>
              </div>
            </div>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={() => setModalOpen(true)}
            style={{ marginTop: 0 }}
          >
            <Icon name="plus" size={18} />
            Add Patient
          </button>
        </section>
      )}

      {toast && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            background: toast.type === "success" ? "#ecfdf5" : "#fff1f2",
            border: `1px solid ${toast.type === "success" ? "#a7f3d0" : "#fecdd3"}`,
            borderRadius: 8,
            color: toast.type === "success" ? "#065f46" : "var(--danger)",
            marginBottom: 20,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Icon name={toast.type === "success" ? "check" : "error"} size={18} />
          {toast.message}
        </div>
      )}

      {/* Filter and Search Toolbar */}
      <section className="toolbar-card" aria-label="Patient search and filters">
        <div className="search-row">
          <div className="search-input-wrap">
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder="Search patients by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search patients by name"
            />
          </div>

          <div className="filter-item">
            <label htmlFor="filter-cond">Condition:</label>
            <input
              id="filter-cond"
              type="text"
              placeholder="e.g. Hypertension"
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
            />
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-item">
            <Icon name="calendar" size={16} />
            <span>Added from:</span>
            <input
              type="date"
              aria-label="Created from date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <span>to:</span>
            <input
              type="date"
              aria-label="Created to date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>

          {hasActiveFilters && (
            <button className="reset-button" type="button" onClick={handleResetFilters}>
              <Icon name="close" size={14} />
              Reset filters
            </button>
          )}

          <div style={{ marginLeft: "auto", fontSize: 13, color: "var(--muted)" }}>
            {loadingPatients || isPending ? (
              <span>Updating…</span>
            ) : (
              <span>
                Found <strong>{pagination.total}</strong>{" "}
                {pagination.total === 1 ? "patient" : "patients"}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Content */}
      {error ? (
        <div className="workspace-state" role="alert">
          <Icon name="error" size={28} />
          <h2>Unable to display patients</h2>
          <p>{error}</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => fetchPatients(pagination.page)}
          >
            Try again
          </button>
        </div>
      ) : loadingPatients && patients.length === 0 ? (
        <div className="workspace-state">
          <p className="content-loading">Loading patients list…</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="workspace-state">
          <Icon name="patients" size={32} />
          <h2>No patients found</h2>
          <p>
            {hasActiveFilters
              ? "No patient records match the current filters."
              : "No patients are currently assigned to this doctor."}
          </p>
          {hasActiveFilters ? (
            <button className="secondary-button" type="button" onClick={handleResetFilters}>
              Clear active filters
            </button>
          ) : (
            <button
              className="primary-button"
              type="button"
              onClick={() => setModalOpen(true)}
              style={{ marginTop: 8 }}
            >
              <Icon name="plus" size={16} />
              Add first patient
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Medical Condition</th>
                  <th>Contact Phone</th>
                  <th>Date Added</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((pat) => {
                  const formattedDate = pat.createdAt
                    ? new Date(pat.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—";

                  const isDeleting = deletingId === pat._id;

                  return (
                    <tr key={pat._id}>
                      <td>
                        <div className="doctor-cell">
                          <div
                            className="avatar-initials"
                            style={{ background: "#f0fdf4", color: "#166534" }}
                            aria-hidden="true"
                          >
                            {pat.name
                              .split(" ")
                              .map((n) => n[0])
                              .filter(Boolean)
                              .slice(0, 2)
                              .join("")
                              .toUpperCase() || "PT"}
                          </div>
                          <div className="doctor-info-text">
                            <strong>{pat.name}</strong>
                            <span>ID: {pat._id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline" style={{ borderColor: "#cbd5e1" }}>
                          {pat.condition}
                        </span>
                      </td>
                      <td>
                        {pat.phone ? (
                          <div className="contact-line">
                            <Icon name="phone" size={14} />
                            <span>{pat.phone}</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, color: "var(--muted)" }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>
                          {formattedDate}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="icon-btn-danger"
                          type="button"
                          disabled={isDeleting}
                          onClick={() => handleDeletePatient(pat)}
                          aria-label={`Remove patient ${pat.name}`}
                          title="Remove patient from doctor"
                        >
                          <Icon name="trash" size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <footer className="pagination-footer">
            <div className="pagination-info">
              Showing{" "}
              <strong>
                {Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}
              </strong>{" "}
              to{" "}
              <strong>
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </strong>{" "}
              of <strong>{pagination.total}</strong> patients
            </div>

            <div className="pagination-controls">
              <div className="filter-item" style={{ marginRight: 8 }}>
                <label htmlFor="patient-page-limit" style={{ fontSize: 12 }}>Per page:</label>
                <select
                  id="patient-page-limit"
                  value={pagination.limit}
                  onChange={(e) => {
                    const nextLimit = Number(e.target.value);
                    setPagination((p) => ({ ...p, limit: nextLimit }));
                    fetchPatients(1, nextLimit);
                  }}
                  style={{ minHeight: 32, padding: "3px 8px", fontSize: 12 }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <button
                className="page-btn"
                type="button"
                disabled={pagination.page <= 1 || loadingPatients}
                onClick={() => fetchPatients(pagination.page - 1)}
                aria-label="Previous page"
              >
                <Icon name="chevron-left" size={16} />
              </button>

              <span style={{ fontSize: 13, fontWeight: 600, padding: "0 6px" }}>
                {pagination.page} / {pagination.totalPages || 1}
              </span>

              <button
                className="page-btn"
                type="button"
                disabled={pagination.page >= pagination.totalPages || loadingPatients}
                onClick={() => fetchPatients(pagination.page + 1)}
                aria-label="Next page"
              >
                <Icon name="chevron-right" size={16} />
              </button>
            </div>
          </footer>
        </>
      )}

      {/* Add Patient Modal */}
      <PatientCreateModal
        doctorId={doctorId}
        doctorName={doctor?.name}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={(newPat) => {
          showToast(`Patient "${newPat.name}" added successfully.`);
          fetchPatients(1);
        }}
      />
    </>
  );
}
