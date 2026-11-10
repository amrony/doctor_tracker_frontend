"use client";

import { useState, useEffect, useRef } from "react";
import { Icon } from "../../components/ui-icon";

export type PatientRecord = {
  _id: string;
  doctorId: { _id: string; name: string; specialization: string } | string;
  name: string;
  condition: string;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
};

type PatientEditModalProps = {
  patient: PatientRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: PatientRecord) => void;
};

export function PatientEditModal({
  patient,
  isOpen,
  onClose,
  onSuccess,
}: PatientEditModalProps) {
  if (!isOpen || !patient) return null;

  return (
    <PatientEditDialog
      key={patient._id}
      patient={patient}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
}

function PatientEditDialog({
  patient,
  onClose,
  onSuccess,
}: Omit<PatientEditModalProps, "isOpen"> & { patient: PatientRecord }) {
  const [name, setName] = useState(patient.name);
  const [condition, setCondition] = useState(patient.condition);
  const [phone, setPhone] = useState(patient.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState("");

  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => nameRef.current?.focus(), 60);
    return () => window.clearTimeout(timer);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setGlobalError("");

    const fieldErrors: Record<string, string> = {};
    if (!name.trim()) fieldErrors.name = "Name is required.";
    if (!condition.trim()) fieldErrors.condition = "Condition is required.";

    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSaving(true);
    try {
      const body: Record<string, string | null> = {
        name: name.trim(),
        condition: condition.trim(),
        phone: phone.trim() || null,
      };

      const res = await fetch(`/api/patients/${patient._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        if (json?.errors) {
          setErrors(json.errors);
        } else {
          setGlobalError(json?.message ?? "Failed to update patient.");
        }
        return;
      }

      onSuccess(json.data);
      onClose();
    } catch {
      setGlobalError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Edit patient">
      <div className="modal-panel">
        <div className="modal-header">
          <h2 className="modal-title">Edit Patient</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="close" size={20} />
          </button>
        </div>

        <form className="modal-form" onSubmit={handleSubmit} noValidate>
          {globalError && (
            <div className="form-error" role="alert">
              <Icon name="error" size={16} />
              {globalError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="edit-patient-name">Full Name *</label>
            <input
              ref={nameRef}
              id="edit-patient-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. John Doe"
              autoComplete="off"
            />
            {errors.name && <span className="field-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="edit-patient-condition">Medical Condition *</label>
            <input
              id="edit-patient-condition"
              type="text"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              placeholder="e.g. Hypertension"
              autoComplete="off"
            />
            {errors.condition && (
              <span className="field-error">{errors.condition}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="edit-patient-phone">Phone (optional)</label>
            <input
              id="edit-patient-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +880 1700 000000"
              autoComplete="off"
            />
            {errors.phone && (
              <span className="field-error">{errors.phone}</span>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="primary-button"
              disabled={saving}
              style={{ marginTop: 0 }}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
