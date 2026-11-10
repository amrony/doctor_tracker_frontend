"use client";

import { useEffect, useState, useTransition, useCallback, useRef } from "react";
import Link from "next/link";
import { Icon } from "../../components/ui-icon";
import { PatientEditModal, type PatientRecord } from "./patient-edit-modal";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type DoctorOption = {
  _id: string;
  name: string;
  specialization: string;
};

type PatientMeta = {
  conditions: string[];
  doctors: DoctorOption[];
};

async function requestPatientMeta(): Promise<PatientMeta> {
  const res = await fetch("/api/patients/meta");
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message ?? "Failed to load patient filters.");
  if (!Array.isArray(json?.data?.conditions) || !Array.isArray(json?.data?.doctors)) {
    throw new Error("The patient filter options could not be read.");
  }
  return { conditions: json.data.conditions, doctors: json.data.doctors };
}

function getDoctorInfo(patient: PatientRecord): { id: string; name: string; spec: string } {
  if (typeof patient.doctorId === "object" && patient.doctorId !== null) {
    return {
      id: patient.doctorId._id,
      name: patient.doctorId.name,
      spec: patient.doctorId.specialization,
    };
  }
  return { id: String(patient.doctorId), name: "Unknown Doctor", spec: "" };
}

export function PatientsView() {
  const [patients, setPatients] = useState<PatientRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [condition, setCondition] = useState("");
  const [doctorId, setDoctorId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [metaError, setMetaError] = useState("");
  const [actionError, setActionError] = useState("");
  const [isPending, startTransition] = useTransition();

  const [knownConditions, setKnownConditions] = useState<string[]>([]);
  const [knownDoctors, setKnownDoctors] = useState<DoctorOption[]>([]);

  const [successToast, setSuccessToast] = useState("");
  const [editingPatient, setEditingPatient] = useState<PatientRecord | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const activeRequest = useRef<AbortController | null>(null);

  const loadMeta = useCallback(async () => {
    try {
      const meta = await requestPatientMeta();
      setKnownConditions(meta.conditions);
      setKnownDoctors(meta.doctors);
      setMetaError("");
    } catch (err: unknown) {
      setMetaError(err instanceof Error ? err.message : "Unable to load patient filters.");
    }
  }, []);

  useEffect(() => {
    let active = true;
    requestPatientMeta().then((meta) => {
      if (!active) return;
      setKnownConditions(meta.conditions);
      setKnownDoctors(meta.doctors);
      setMetaError("");
    }).catch((err: unknown) => {
      if (active) setMetaError(err instanceof Error ? err.message : "Unable to load patient filters.");
    });
    return () => {
      active = false;
    };
  }, []);

  const fetchPatients = useCallback(
    async (targetPage = 1, targetLimit = pagination.limit) => {
      activeRequest.current?.abort();
      const controller = new AbortController();
      activeRequest.current = controller;
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("limit", String(targetLimit));
      if (search.trim()) params.set("q", search.trim());
      if (condition.trim()) params.set("condition", condition.trim());
      if (doctorId.trim()) params.set("doctorId", doctorId.trim());
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      try {
        const res = await fetch(`/api/patients?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message ?? "Failed to load patients.");
        }
        const json = await res.json();
        setPatients(json.data ?? []);
        if (json.pagination) setPagination(json.pagination);
      } catch (err: unknown) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          setError(err instanceof Error ? err.message : "Unable to load patients.");
        }
      } finally {
        if (activeRequest.current === controller) {
          activeRequest.current = null;
          setLoading(false);
        }
      }
    },
    [search, condition, doctorId, fromDate, toDate, pagination.limit],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(() => {
        fetchPatients(1);
      });
    }, 280);
    return () => {
      clearTimeout(timer);
      activeRequest.current?.abort();
    };
  }, [search, condition, doctorId, fromDate, toDate, fetchPatients]);

  function handleResetFilters() {
    setSearch("");
    setCondition("");
    setDoctorId("");
    setFromDate("");
    setToDate("");
  }

  function showToast(msg: string) {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(""), 4000);
  }

  function handlePatientUpdated(updated: PatientRecord) {
    setPatients((prev) =>
      prev.map((p) => (p._id === updated._id ? { ...p, ...updated } : p)),
    );
    setActionError("");
    showToast(`Patient "${updated.name}" updated successfully.`);
    void fetchPatients(pagination.page);
    void loadMeta();
  }

  async function handleDelete(patientId: string) {
    setDeletingId(patientId);
    setActionError("");
    try {
      const res = await fetch(`/api/patients/${patientId}`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        const json = await res.json().catch(() => null);
        setActionError(json?.message ?? "Failed to delete patient.");
        return;
      }
      setPatients((prev) => prev.filter((p) => p._id !== patientId));
      const remainingTotal = Math.max(0, pagination.total - 1);
      const lastPage = Math.max(1, Math.ceil(remainingTotal / pagination.limit));
      const targetPage = Math.min(pagination.page, lastPage);
      showToast("Patient deleted successfully.");
      setConfirmDeleteId(null);
      void fetchPatients(targetPage);
      void loadMeta();
    } catch {
      setActionError("Network error. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  const hasActiveFilters = Boolean(search || condition || doctorId || fromDate || toDate);

  return (
    <>
      <header className="directory-header">
        <div>
          <p className="eyebrow">Medical Records</p>
          <h1
            style={{
              margin: "4px 0 6px",
              fontSize: "clamp(28px, 4vw, 42px)",
              fontWeight: 750,
              letterSpacing: "-.04em",
            }}
          >
            All Patients
          </h1>
          <p className="page-description">
            Browse, search, edit, and manage all patient records across doctors.
          </p>
        </div>
      </header>

      {/* Toast */}
      {successToast && (
        <div
          role="status"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 16px",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: 8,
            color: "#065f46",
            marginBottom: 20,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <Icon name="check" size={18} />
          {successToast}
        </div>
      )}

      {actionError && (
        <div className="form-error" role="alert">
          <Icon name="error" size={16} />
          {actionError}
        </div>
      )}

      {metaError && (
        <div className="form-error" role="alert">
          <Icon name="error" size={16} />
          <span>{metaError}</span>
          <button className="secondary-button" type="button" onClick={() => void loadMeta()}>
            Retry filters
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <section className="toolbar-card" aria-label="Patient directory filters">
        <div className="search-row">
          <div className="search-input-wrap">
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder="Search by patient name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search patients"
            />
          </div>

          <div className="filter-item">
            <label htmlFor="filter-condition">Condition:</label>
            <select
              id="filter-condition"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            >
              <option value="">All Conditions</option>
              {knownConditions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-doctor">Doctor:</label>
            <select
              id="filter-doctor"
              value={doctorId}
              onChange={(e) => setDoctorId(e.target.value)}
            >
              <option value="">All Doctors</option>
              {knownDoctors.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
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
            {loading || isPending ? (
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
      ) : loading && patients.length === 0 ? (
        <div className="workspace-state">
          <p className="content-loading">Loading patient records…</p>
        </div>
      ) : patients.length === 0 ? (
        <div className="workspace-state">
          <Icon name="patients" size={32} />
          <h2>No patients found</h2>
          <p>
            {hasActiveFilters
              ? "No patients matched your search and filter criteria."
              : "No patient records exist yet. Add patients through a doctor's profile."}
          </p>
          {hasActiveFilters && (
            <button className="secondary-button" type="button" onClick={handleResetFilters}>
              Clear active filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Condition</th>
                  <th>Doctor</th>
                  <th>Phone</th>
                  <th>Date Added</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => {
                  const docInfo = getDoctorInfo(patient);
                  const initials = patient.name
                    .split(" ")
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "P";

                  const formattedDate = patient.createdAt
                    ? new Date(patient.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—";

                  const isDeleting = deletingId === patient._id;
                  const isConfirming = confirmDeleteId === patient._id;

                  return (
                    <tr key={patient._id}>
                      <td>
                        <div className="doctor-cell">
                          <div
                            className="avatar-initials"
                            aria-hidden="true"
                            style={{ background: "var(--muted)", fontSize: 12 }}
                          >
                            {initials}
                          </div>
                          <div className="doctor-info-text">
                            <strong>{patient.name}</strong>
                            <span>ID: {patient._id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge">{patient.condition}</span>
                      </td>
                      <td>
                        <div className="contact-line">
                          <Icon name="doctors" size={14} />
                          <Link
                            href={`/doctors/${docInfo.id}/patients`}
                            prefetch={false}
                            style={{ color: "var(--brand)", textDecoration: "none", fontWeight: 600, fontSize: 13 }}
                          >
                            {docInfo.name}
                          </Link>
                        </div>
                        {docInfo.spec && (
                          <span style={{ fontSize: 12, color: "var(--muted)" }}>
                            {docInfo.spec}
                          </span>
                        )}
                      </td>
                      <td>
                        {patient.phone ? (
                          <div className="contact-line">
                            <Icon name="phone" size={14} />
                            <span style={{ fontSize: 13 }}>{patient.phone}</span>
                          </div>
                        ) : (
                          <span style={{ color: "var(--muted)", fontSize: 13 }}>—</span>
                        )}
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>
                          {formattedDate}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, alignItems: "center" }}>
                          {isConfirming ? (
                            <>
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "var(--danger)",
                                  fontWeight: 600,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                Delete?
                              </span>
                              <button
                                className="icon-btn-danger"
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDelete(patient._id)}
                                aria-label="Confirm delete"
                                style={{ padding: "4px 10px", fontSize: 12, borderRadius: 6, minHeight: 30 }}
                              >
                                {isDeleting ? "…" : "Yes"}
                              </button>
                              <button
                                className="secondary-button"
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                style={{ padding: "4px 10px", fontSize: 12, minHeight: 30 }}
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="secondary-button"
                                type="button"
                                onClick={() => setEditingPatient(patient)}
                                style={{ minHeight: 32, padding: "4px 10px", fontSize: 12 }}
                                aria-label={`Edit ${patient.name}`}
                              >
                                <Icon name="edit" size={14} />
                                Edit
                              </button>
                              <button
                                className="icon-btn-danger"
                                type="button"
                                onClick={() => setConfirmDeleteId(patient._id)}
                                style={{ minHeight: 32, padding: "4px 10px", fontSize: 12 }}
                                aria-label={`Delete ${patient.name}`}
                              >
                                <Icon name="trash" size={14} />
                              </button>
                            </>
                          )}
                        </div>
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
                <label htmlFor="patients-page-limit" style={{ fontSize: 12 }}>
                  Per page:
                </label>
                <select
                  id="patients-page-limit"
                  value={pagination.limit}
                  onChange={(e) => {
                    setPagination((p) => ({ ...p, limit: Number(e.target.value) }));
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
                disabled={pagination.page <= 1 || loading}
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
                disabled={pagination.page >= pagination.totalPages || loading}
                onClick={() => fetchPatients(pagination.page + 1)}
                aria-label="Next page"
              >
                <Icon name="chevron-right" size={16} />
              </button>
            </div>
          </footer>
        </>
      )}

      {/* Edit Modal */}
      <PatientEditModal
        isOpen={editingPatient !== null}
        patient={editingPatient}
        onClose={() => setEditingPatient(null)}
        onSuccess={handlePatientUpdated}
      />
    </>
  );
}
