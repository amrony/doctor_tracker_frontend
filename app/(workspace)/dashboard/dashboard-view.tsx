"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "../../components/ui-icon";

type Analytics = {
  totals: { doctors: number; patients: number };
  patientsByDoctor: {
    doctorId: string;
    doctorName: string;
    specialization: string;
    patientCount: number;
  }[];
  patientTrend: { date: string; count: number }[];
  periodDays: number;
};

async function fetchAnalytics(days: number): Promise<Analytics> {
  const response = await fetch(`/api/dashboard/analytics?days=${days}`);
  const json = await response.json().catch(() => null);
  if (!response.ok) throw new Error(json?.message ?? "Unable to load dashboard analytics.");
  if (!json?.data?.totals || !Array.isArray(json.data.patientsByDoctor) || !Array.isArray(json.data.patientTrend)) {
    throw new Error("The dashboard analytics response was incomplete.");
  }
  return json.data;
}

function PatientTrendChart({ trend }: { trend: Analytics["patientTrend"] }) {
  const width = 620;
  const height = 220;
  const left = 26;
  const right = 594;
  const top = 18;
  const bottom = 178;
  const highestCount = Math.max(1, ...trend.map((item) => item.count));
  const points = trend.map((item, index) => ({
    ...item,
    x: trend.length === 1 ? (left + right) / 2 : left + (index * (right - left)) / (trend.length - 1),
    y: bottom - (item.count / highestCount) * (bottom - top),
  }));
  const linePoints = points.map(({ x, y }) => `${x},${y}`).join(" ");
  const labelIndexes = new Set([0, Math.floor((trend.length - 1) / 2), trend.length - 1]);

  return (
    <div className="dashboard-chart">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Patients added per day over the last ${trend.length} days`}
        preserveAspectRatio="none"
      >
        {[0, 0.5, 1].map((fraction) => {
          const y = bottom - fraction * (bottom - top);
          return (
            <g key={fraction}>
              <line x1={left} y1={y} x2={right} y2={y} className="chart-gridline" />
              <text x="0" y={y + 4} className="chart-axis-label">
                {Math.round(highestCount * fraction)}
              </text>
            </g>
          );
        })}
        <polyline points={linePoints} className="chart-line" />
        {points.map((point) => (
          <circle key={point.date} cx={point.x} cy={point.y} r="3" className="chart-point">
            <title>{point.date}: {point.count} {point.count === 1 ? "patient" : "patients"}</title>
          </circle>
        ))}
        {points.map((point, index) => labelIndexes.has(index) && (
          <text
            key={`label-${point.date}`}
            x={point.x}
            y="207"
            textAnchor={index === 0 ? "start" : index === trend.length - 1 ? "end" : "middle"}
            className="chart-date-label"
          >
            {new Date(`${point.date}T00:00:00.000Z`).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              timeZone: "UTC",
            })}
          </text>
        ))}
      </svg>
    </div>
  );
}

export function DashboardView() {
  const [days, setDays] = useState(30);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async (period: number) => {
    setLoading(true);
    setError("");
    try {
      setAnalytics(await fetchAnalytics(period));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to load dashboard analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchAnalytics(days).then((data) => {
      if (active) {
        setAnalytics(data);
        setError("");
      }
    }).catch((err: unknown) => {
      if (active) setError(err instanceof Error ? err.message : "Unable to load dashboard analytics.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [days]);

  const maximumDoctorPatients = analytics?.patientsByDoctor.reduce(
    (maximum, doctor) => Math.max(maximum, doctor.patientCount),
    1,
  ) ?? 1;

  return (
    <>
      <header className="dashboard-heading">
        <div>
          <p className="eyebrow">Workspace overview</p>
          <h1>Dashboard</h1>
          <p className="page-description">A clear view of your doctors and patient activity.</p>
        </div>
        <label className="dashboard-period">
          <Icon name="calendar" size={16} />
          <span>Patient activity</span>
          <select
            aria-label="Patient activity period"
            value={days}
            onChange={(event) => {
              setLoading(true);
              setDays(Number(event.target.value));
            }}
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </label>
      </header>

      {error ? (
        <section className="workspace-state" role="alert">
          <Icon name="error" size={28} />
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
          <button className="secondary-button" type="button" onClick={() => void loadAnalytics(days)}>
            Try again
          </button>
        </section>
      ) : (
        <>
          <section className="dashboard-metrics" aria-label="Directory totals">
            <Link className="dashboard-metric" href="/doctors" prefetch={false}>
              <span className="dashboard-metric-icon"><Icon name="doctors" size={21} /></span>
              <span className="dashboard-metric-label">Total doctors</span>
              <strong>{loading && !analytics ? "—" : analytics?.totals.doctors ?? 0}</strong>
              <span className="dashboard-metric-link">View directory <Icon name="arrow" size={15} /></span>
            </Link>
            <Link className="dashboard-metric" href="/patients" prefetch={false}>
              <span className="dashboard-metric-icon"><Icon name="patients" size={21} /></span>
              <span className="dashboard-metric-label">Total patients</span>
              <strong>{loading && !analytics ? "—" : analytics?.totals.patients ?? 0}</strong>
              <span className="dashboard-metric-link">View directory <Icon name="arrow" size={15} /></span>
            </Link>
          </section>

          <section className="dashboard-panel" aria-labelledby="patient-trend-title">
            <div className="dashboard-panel-heading">
              <div>
                <h2 id="patient-trend-title">Patient activity</h2>
                <p>New patient records by day, including days with no additions.</p>
              </div>
              {loading && <span className="dashboard-updating" role="status">Updating…</span>}
            </div>
            {analytics && analytics.totals.patients === 0 ? (
              <div className="dashboard-empty">
                <Icon name="patients" size={22} />
                <span>No patient records yet. Activity will appear here when patients are added.</span>
              </div>
            ) : analytics ? (
              <PatientTrendChart trend={analytics.patientTrend} />
            ) : (
              <div className="dashboard-chart-placeholder" role="status">Loading patient activity…</div>
            )}
          </section>

          <section className="dashboard-panel" aria-labelledby="patients-by-doctor-title">
            <div className="dashboard-panel-heading">
              <div>
                <h2 id="patients-by-doctor-title">Patients by doctor</h2>
                <p>Patient records assigned to each doctor.</p>
              </div>
            </div>
            {loading && !analytics ? (
              <div className="dashboard-chart-placeholder" role="status">Loading doctor totals…</div>
            ) : analytics?.patientsByDoctor.length ? (
              <ol className="doctor-analytics-list">
                {analytics.patientsByDoctor.map((doctor) => (
                  <li key={doctor.doctorId}>
                    <Link href={`/doctors/${doctor.doctorId}/patients`} prefetch={false}>
                      <span className="doctor-analytics-name">
                        <strong>{doctor.doctorName}</strong>
                        <span>{doctor.specialization}</span>
                      </span>
                      <span className="doctor-analytics-bar" aria-hidden="true">
                        <span style={{ width: `${(doctor.patientCount / maximumDoctorPatients) * 100}%` }} />
                      </span>
                      <strong className="doctor-analytics-count">{doctor.patientCount}</strong>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="dashboard-empty">
                <Icon name="doctors" size={22} />
                <span>No doctors to compare yet. Add a doctor to see patient totals here.</span>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}
