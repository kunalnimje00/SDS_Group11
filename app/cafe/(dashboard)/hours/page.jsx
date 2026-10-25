"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Save, Plus, Trash2, CheckCircle, AlertTriangle } from "lucide-react";
import { PageHeading, EmptyState } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function emptyShift(dayOfWeek) {
  return { day_of_week: dayOfWeek, opens_at: "08:00", closes_at: "22:00", is_closed: false };
}

export default function CafeHoursPage() {
  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const fetchHours = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: err } = await supabase.rpc("cafe_get_hours");
      if (err) throw new Error(err.message);
      setShifts(Array.isArray(data) ? data : []);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchHours(); }, [fetchHours]);

  function showToast(msg, type = "success") {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 4000);
  }

  function updateShift(index, field, value) {
    setShifts((prev) => prev.map((s, i) => i === index ? { ...s, [field]: value } : s));
  }

  function addShift(dayOfWeek) {
    setShifts((prev) => [...prev, emptyShift(dayOfWeek)]);
  }

  function removeShift(index) {
    setShifts((prev) => prev.filter((_, i) => i !== index));
  }

  function toggleClosed(dayOfWeek) {
    setShifts((prev) => {
      const dayShifts = prev.filter((s) => s.day_of_week === dayOfWeek);
      const otherShifts = prev.filter((s) => s.day_of_week !== dayOfWeek);
      if (dayShifts.length === 0 || !dayShifts[0].is_closed) {
        // Mark as closed
        return [...otherShifts, { day_of_week: dayOfWeek, opens_at: "00:00", closes_at: "00:00", is_closed: true }];
      } else {
        // Mark as open with default shift
        return [...otherShifts, emptyShift(dayOfWeek)];
      }
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Validate: no empty times
      for (const shift of shifts) {
        if (!shift.is_closed && (!shift.opens_at || !shift.closes_at)) {
          showToast("All shifts must have opening and closing times", "error");
          setSaving(false);
          return;
        }
        if (!shift.is_closed && shift.opens_at === shift.closes_at) {
          showToast(`${DAY_NAMES[shift.day_of_week]}: opening and closing times cannot be identical`, "error");
          setSaving(false);
          return;
        }
      }

      const payload = shifts.map((s) => ({
        day_of_week: s.day_of_week,
        opens_at: s.opens_at,
        closes_at: s.closes_at,
        ...(s.is_closed ? { is_closed: true } : {}),
      }));

      const { error: err } = await supabase.rpc("cafe_put_hours", { p_shifts: payload });
      if (err) throw new Error(err.message);
      showToast("Operating hours saved successfully");
      await fetchHours();
    } catch (err) { showToast(err.message || "Failed to save hours", "error"); }
    finally { setSaving(false); }
  }

  // Group shifts by day
  const shiftsByDay = {};
  for (let d = 1; d <= 7; d++) shiftsByDay[d] = [];
  shifts.forEach((s) => {
    if (shiftsByDay[s.day_of_week]) shiftsByDay[s.day_of_week].push(s);
  });

  return (
    <div className="page-stack">
      <PageHeading eyebrow="KITCHEN SCHEDULE" title="Operating Hours" description="Set cafeteria opening shifts and service windows for each day of the week."
        action={
          <button className="button button-primary button-small" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? "Saving..." : "Save Hours"}
          </button>
        }
      />

      {loading ? (
        <div style={{ display: "grid", gap: 10 }}>{[1, 2, 3, 4, 5, 6, 7].map((i) => <div key={i} className="skeleton-row" />)}</div>
      ) : error ? (
        <EmptyState icon={AlertTriangle} title="Error loading hours" description={error} />
      ) : (
        <div className="hours-editor">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const dayShifts = shiftsByDay[day] || [];
            const isClosed = dayShifts.length > 0 && dayShifts[0].is_closed;

            return (
              <div key={day} className="hours-day-row">
                <span className="hours-day-label">{DAY_NAMES[day]}</span>

                {isClosed ? (
                  <span className="hours-day-closed">Closed</span>
                ) : (
                  <div className="hours-shifts">
                    {dayShifts.length === 0 && (
                      <span style={{ color: "var(--muted)", fontSize: 10 }}>No shifts set</span>
                    )}
                    {dayShifts.map((shift) => {
                      const globalIdx = shifts.indexOf(shift);
                      return (
                        <div key={globalIdx} className="hours-shift">
                          <input type="time" className="hours-shift-input" value={shift.opens_at || ""} onChange={(e) => updateShift(globalIdx, "opens_at", e.target.value)} />
                          <span style={{ color: "var(--muted)" }}>to</span>
                          <input type="time" className="hours-shift-input" value={shift.closes_at || ""} onChange={(e) => updateShift(globalIdx, "closes_at", e.target.value)} />
                          <button className="icon-button" style={{ width: 24, height: 24 }} onClick={() => removeShift(globalIdx)} title="Remove shift">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="hours-day-actions">
                  {!isClosed && (
                    <button className="button button-secondary button-small" onClick={() => addShift(day)} title="Add shift">
                      <Plus size={12} />
                    </button>
                  )}
                  <button className={`button button-small ${isClosed ? "button-warning" : "button-secondary"}`} onClick={() => toggleClosed(day)}>
                    {isClosed ? "Open" : "Close"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="toast-container">
          <div className={`toast toast-${toast.type}`}>
            {toast.type === "success" ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {toast.message}
          </div>
        </div>
      )}
    </div>
  );
}
