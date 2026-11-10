"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "../../components/ui-icon";

export type DoctorRecord = {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  createdAt: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newDoctor: DoctorRecord) => void;
};

export function DoctorCreateModal({ isOpen, onClose, onSuccess }: Props) {
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
      specialization: (formData.get("specialization") as string)?.trim(),
      hospital: (formData.get("hospital") as string)?.trim(),
      phone: (formData.get("phone") as string)?.trim(),
      email: (formData.get("email") as string)?.trim(),
    };

    // Client-side quick checks
    const errors: Record<string, string> = {};
    if (!payload.name) errors.name = "Doctor name is required.";
    if (!payload.specialization) errors.specialization = "Specialization is required.";
    if (!payload.hospital) errors.hospital = "Hospital name is required.";
    if (!payload.phone) errors.phone = "Phone number is required.";
    if (!payload.email) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
      errors.email = "Enter a valid email address.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/doctors", {
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
        setGeneralError(result?.message || "Failed to create doctor record.");
      }
    } catch {
      setGeneralError("Network error. Please verify your connection.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-card">
        <div className="modal-header">
          <h2 id="modal-title">Add New Doctor</h2>
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
                <label htmlFor="doc-name">Full Name *</label>
                <input
                  id="doc-name"
                  name="name"
                  type="text"
                  placeholder="e.g. Dr. Aminul Islam"
                  maxLength={120}
                  required
                />
                {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
              </div>

              <div className="input-field">
                <label htmlFor="doc-spec">Specialization *</label>
                <input
                  id="doc-spec"
                  name="specialization"
                  type="text"
                  placeholder="e.g. Cardiology"
                  maxLength={120}
                  required
                />
                {fieldErrors.specialization && (
                  <span className="field-error">{fieldErrors.specialization}</span>
                )}
              </div>

              <div className="input-field">
                <label htmlFor="doc-hospital">Hospital / Clinic *</label>
                <input
                  id="doc-hospital"
                  name="hospital"
                  type="text"
                  placeholder="e.g. City General Hospital"
                  maxLength={160}
                  required
                />
                {fieldErrors.hospital && (
                  <span className="field-error">{fieldErrors.hospital}</span>
                )}
              </div>

              <div className="input-field">
                <label htmlFor="doc-phone">Phone Number *</label>
                <input
                  id="doc-phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. +8801xxxxxxxxx"
                  maxLength={32}
                  required
                />
                {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
              </div>

              <div className="input-field">
                <label htmlFor="doc-email">Email Address *</label>
                <input
                  id="doc-email"
                  name="email"
                  type="email"
                  placeholder="e.g. s.jenkins@hospital.org"
                  maxLength={254}
                  required
                />
                {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button className="secondary-button" type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button className="primary-button" type="submit" disabled={submitting} style={{ marginTop: 0 }}>
              {submitting ? "Saving doctor…" : "Save Doctor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
