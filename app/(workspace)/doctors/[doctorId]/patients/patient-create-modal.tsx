"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/app/components/ui-icon";

export type PatientRecord = {
  _id: string;
  doctorId: string;
  name: string;
  condition: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

type Props = {
  doctorId: string;
  doctorName?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newPatient: PatientRecord) => void;
};

export function PatientCreateModal({
  doctorId,
  doctorName,
  isOpen,
  onClose,
  onSuccess,
}: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");

  if (!isOpen) return null;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFieldErrors({});
    setGeneralError("");

    const formData = new FormData(event.currentTarget);
    const payload = {
      name: (formData.get("name") as string)?.trim(),
      condition: (formData.get("condition") as string)?.trim(),
      phone: (formData.get("phone") as string)?.trim() || null,
    };

    const errors: Record<string, string> = {};
    if (!payload.name) errors.name = "Patient name is required.";
    if (!payload.condition) errors.condition = "Condition/diagnosis is required.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/doctors/${doctorId}/patients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (response.ok && result?.data) {
        onSuccess(result.data);
        onClose();
        return;
      }

      if (response.status === 400 && result?.errors) {
        setFieldErrors(result.errors);
      } else {
        setGeneralError(result?.message || "Failed to add patient.");
      }
    } catch {
      setGeneralError("Network error. Please verify your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-patient-title">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <h2 id="modal-patient-title">Add Patient</h2>
            {doctorName && (
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--muted)" }}>
                Attending: <strong>{doctorName}</strong>
              </p>
            )}
          </div>
          <button className="close-btn" type="button" onClick={onClose} aria-label="Close modal">
            <Icon name="close" size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            {generalError && (
              <p className="form-error" role="alert" style={{ marginTop: 0, marginBottom: 16 }}>
                <Icon name="error" size={18} />
                {generalError}
              </p>
            )}

            <div className="form-grid-2">
              <div className="input-field form-full">
                <label htmlFor="pat-name">Patient Full Name *</label>
                <input
                  id="pat-name"
                  name="name"
                  type="text"
                  placeholder="e.g. Aminul Islam"
                  maxLength={120}
                  required
                />
                {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
              </div>

              <div className="input-field form-full">
                <label htmlFor="pat-cond">Condition / Diagnosis *</label>
                <input
                  id="pat-cond"
                  name="condition"
                  type="text"
                  placeholder="e.g. Hypertension & Post-op Recovery"
                  maxLength={160}
                  required
                />
                {fieldErrors.condition && (
                  <span className="field-error">{fieldErrors.condition}</span>
                )}
              </div>

              <div className="input-field form-full">
                <label htmlFor="pat-phone">Phone Number (optional)</label>
                <input
                  id="pat-phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. +8801xxxxxxxxx"
                  maxLength={32}
                />
                {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="secondary-button" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button className="primary-button" type="submit" disabled={submitting} style={{ marginTop: 0 }}>
              {submitting ? "Adding patient…" : "Save Patient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

