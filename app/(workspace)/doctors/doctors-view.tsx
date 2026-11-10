"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import Link from "next/link";
import { Icon } from "../../components/ui-icon";
import { DoctorCreateModal, type DoctorRecord } from "./doctor-create-modal";

type PaginationData = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export function DoctorsView() {
  const [doctors, setDoctors] = useState<DoctorRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });

  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [hospital, setHospital] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState("");

  const [isPending, startTransition] = useTransition();

  // Known options collected from doctors for handy dropdown filtering
  const [knownSpecializations, setKnownSpecializations] = useState<string[]>([]);
  const [knownHospitals, setKnownHospitals] = useState<string[]>([]);

  // Load distinct filter options on mount
  useEffect(() => {
    async function loadMeta() {
      try {
        const res = await fetch("/api/doctors/meta");
        if (res.ok) {
          const json = await res.json();
          if (json.data?.specializations) {
            setKnownSpecializations(json.data.specializations);
          }
          if (json.data?.hospitals) {
            setKnownHospitals(json.data.hospitals);
          }
        }
      } catch {
        // Fallback to dynamic collection
      }
    }
    loadMeta();
  }, []);

  const fetchDoctors = useCallback(
    async (targetPage = 1, targetLimit = pagination.limit) => {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();
      params.set("page", String(targetPage));
      params.set("limit", String(targetLimit));

      if (search.trim()) params.set("q", search.trim());
      if (specialization.trim()) params.set("specialization", specialization.trim());
      if (hospital.trim()) params.set("hospital", hospital.trim());
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);

      try {
        const response = await fetch(`/api/doctors?${params.toString()}`);
        if (!response.ok) {
          const errData = await response.json().catch(() => null);
          throw new Error(errData?.message || "Failed to load doctor directory.");
        }

        const json = await response.json();
        setDoctors(json.data || []);
        if (json.pagination) {
          setPagination(json.pagination);
        }

        // Dynamically track distinct options
        if (Array.isArray(json.data)) {
          setKnownSpecializations((prev) => {
            const set = new Set(prev);
            for (const d of json.data) {
              if (d.specialization) set.add(d.specialization);
            }
            return Array.from(set).sort();
          });

          setKnownHospitals((prev) => {
            const set = new Set(prev);
            for (const d of json.data) {
              if (d.hospital) set.add(d.hospital);
            }
            return Array.from(set).sort();
          });
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Unable to load doctors.");
      } finally {
        setLoading(false);
      }
    },
    [search, specialization, hospital, fromDate, toDate, pagination.limit],
  );

  useEffect(() => {
    // Initial fetch and when filters change
    const debounceTimer = setTimeout(() => {
      startTransition(() => {
        fetchDoctors(1);
      });
    }, 280);

    return () => clearTimeout(debounceTimer);
  }, [search, specialization, hospital, fromDate, toDate, fetchDoctors]);

  function handleResetFilters() {
    setSearch("");
    setSpecialization("");
    setHospital("");
    setFromDate("");
    setToDate("");
  }

  function handleDoctorCreated(newDoc: DoctorRecord) {
    setSuccessToast(`Doctor "${newDoc.name}" added successfully.`);
    setTimeout(() => setSuccessToast(""), 4000);
    fetchDoctors(1);
  }

  const hasActiveFilters = Boolean(
    search || specialization || hospital || fromDate || toDate,
  );

  return (
    <>
      <header className="directory-header">
        <div>
          <p className="eyebrow">Medical Staff</p>
          <h1 style={{ margin: "4px 0 6px", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 750, letterSpacing: "-.04em" }}>
            Doctors Directory
          </h1>
          <p className="page-description">
            Manage your clinic doctors, contact profiles, and associated patients.
          </p>
        </div>

        <div className="directory-actions">
          <button
            className="primary-button"
            type="button"
            onClick={() => setModalOpen(true)}
            style={{ marginTop: 0 }}
          >
            <Icon name="plus" size={18} />
            Add Doctor
          </button>
        </div>
      </header>

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

      {/* Filter and Search Toolbar */}
      <section className="toolbar-card" aria-label="Doctor directory filters">
        <div className="search-row">
          <div className="search-input-wrap">
            <Icon name="search" size={18} />
            <input
              type="search"
              placeholder="Search by doctor name, specialization, or hospital…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search doctors"
            />
          </div>

          <div className="filter-item">
            <label htmlFor="filter-spec">Specialization:</label>
            <select
              id="filter-spec"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
            >
              <option value="">All Specializations</option>
              {knownSpecializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="filter-hosp">Hospital:</label>
            <select
              id="filter-hosp"
              value={hospital}
              onChange={(e) => setHospital(e.target.value)}
            >
              <option value="">All Hospitals</option>
              {knownHospitals.map((hosp) => (
                <option key={hosp} value={hosp}>
                  {hosp}
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
            <button
              className="reset-button"
              type="button"
              onClick={handleResetFilters}
            >
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
                {pagination.total === 1 ? "doctor" : "doctors"}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Main Content State: Error, Loading or List */}
      {error ? (
        <div className="workspace-state" role="alert">
          <Icon name="error" size={28} />
          <h2>Unable to display doctors</h2>
          <p>{error}</p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => fetchDoctors(pagination.page)}
          >
            Try again
          </button>
        </div>
      ) : loading && doctors.length === 0 ? (
        <div className="workspace-state">
          <p className="content-loading">Loading doctors directory…</p>
        </div>
      ) : doctors.length === 0 ? (
        <div className="workspace-state">
          <Icon name="doctors" size={32} />
          <h2>No doctors found</h2>
          <p>
            {hasActiveFilters
              ? "No doctors matched your search and filter criteria."
              : "No doctor records exist in your practice yet."}
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
              Add your first doctor
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Doctor</th>
                  <th>Specialization</th>
                  <th>Hospital</th>
                  <th>Contact Info</th>
                  <th>Date Added</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => {
                  const initials = doc.name
                    .replace(/^Dr\.\s*/i, "")
                    .split(" ")
                    .map((n) => n[0])
                    .filter(Boolean)
                    .slice(0, 2)
                    .join("")
                    .toUpperCase() || "DR";

                  const formattedDate = doc.createdAt
                    ? new Date(doc.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—";

                  return (
                    <tr key={doc._id}>
                      <td>
                        <div className="doctor-cell">
                          <div className="avatar-initials" aria-hidden="true">
                            {initials}
                          </div>
                          <div className="doctor-info-text">
                            <strong>{doc.name}</strong>
                            <span>ID: {doc._id.slice(-6)}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge">{doc.specialization}</span>
                      </td>
                      <td>
                        <div className="contact-line">
                          <Icon name="hospital" size={15} />
                          <span>{doc.hospital}</span>
                        </div>
                      </td>
                      <td>
                        <div className="contact-meta">
                          <div className="contact-line">
                            <Icon name="phone" size={14} />
                            <span>{doc.phone}</span>
                          </div>
                          <div className="contact-line">
                            <Icon name="mail" size={14} />
                            <span>{doc.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: "var(--muted)" }}>
                          {formattedDate}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Link
                          className="secondary-button"
                          href={`/doctors/${doc._id}/patients`}
                          prefetch={false}
                          style={{ minHeight: 34, padding: "5px 12px", fontSize: 13 }}
                        >
                          <Icon name="patients" size={15} />
                          Patients
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
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
              of <strong>{pagination.total}</strong> doctors
            </div>

            <div className="pagination-controls">
              <div className="filter-item" style={{ marginRight: 8 }}>
                <label htmlFor="page-limit" style={{ fontSize: 12 }}>Per page:</label>
                <select
                  id="page-limit"
                  value={pagination.limit}
                  onChange={(e) => {
                    const nextLimit = Number(e.target.value);
                    setPagination((p) => ({ ...p, limit: nextLimit }));
                    fetchDoctors(1, nextLimit);
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
                onClick={() => fetchDoctors(pagination.page - 1)}
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
                onClick={() => fetchDoctors(pagination.page + 1)}
                aria-label="Next page"
              >
                <Icon name="chevron-right" size={16} />
              </button>
            </div>
          </footer>
        </>
      )}

      {/* Creation Modal */}
      <DoctorCreateModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleDoctorCreated}
      />
    </>
  );
}
