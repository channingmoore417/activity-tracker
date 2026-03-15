"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Mail, MessageSquare, Phone, Plus, Search, Users, X } from "lucide-react";
import { ContactModal } from "@/components/contact-modal";
import type { ContactRecord, ContactsPageData } from "@/lib/db/tracker";
import styles from "./tracker-shell.module.css";

/* ── Field definitions ─────────────────────────────────────────────── */

type FieldType = "text" | "number" | "boolean" | "enum" | "date-text";

type FieldDef = {
  key: keyof ContactRecord;
  label: string;
  type: FieldType;
  options?: string[]; // for enum fields
};

const CONTACT_TYPES = ["Realtor", "Past Client", "Referral", "Lead", "Financial Advisor", "CPA", "Attorney"];

const FIELD_DEFS: FieldDef[] = [
  { key: "contactType", label: "Contact Type", type: "enum", options: CONTACT_TYPES },
  { key: "city", label: "City", type: "text" },
  { key: "state", label: "State", type: "text" },
  { key: "creditScore", label: "Credit Score", type: "number" },
  { key: "dob", label: "Date of Birth", type: "date-text" },
  { key: "homeAnniversary", label: "Home Anniversary", type: "date-text" },
  { key: "militaryVeteran", label: "Military / Veteran", type: "boolean" },
  { key: "employment", label: "Employment", type: "text" },
  { key: "income", label: "Income", type: "text" },
  { key: "downPayment", label: "Down Payment", type: "text" },
  { key: "timeline", label: "Timeline", type: "text" },
  { key: "realtorName", label: "Realtor", type: "text" },
  { key: "notes", label: "Notes", type: "text" },
];

type Operator =
  | "is" | "is_not" | "contains" | "does_not_contain"
  | "eq" | "gte" | "lte"
  | "is_true" | "is_false"
  | "has_value" | "no_value"
  | "today" | "tomorrow" | "yesterday" | "in_7_days" | "in_30_days" | "this_month" | "on_date";

const OPS_BY_TYPE: Record<FieldType, { value: Operator; label: string }[]> = {
  text: [
    { value: "contains", label: "contains" },
    { value: "does_not_contain", label: "does not contain" },
    { value: "is", label: "is exactly" },
    { value: "is_not", label: "is not" },
    { value: "has_value", label: "has value" },
    { value: "no_value", label: "is empty" },
  ],
  number: [
    { value: "eq", label: "equals" },
    { value: "gte", label: "≥" },
    { value: "lte", label: "≤" },
    { value: "has_value", label: "has value" },
    { value: "no_value", label: "is empty" },
  ],
  boolean: [
    { value: "is_true", label: "Yes" },
    { value: "is_false", label: "No" },
  ],
  enum: [
    { value: "is", label: "is" },
    { value: "is_not", label: "is not" },
  ],
  "date-text": [
    { value: "today", label: "is today" },
    { value: "tomorrow", label: "is tomorrow" },
    { value: "yesterday", label: "was yesterday" },
    { value: "in_7_days", label: "in next 7 days" },
    { value: "in_30_days", label: "in next 30 days" },
    { value: "this_month", label: "this month" },
    { value: "on_date", label: "is on date" },
    { value: "contains", label: "contains" },
    { value: "is", label: "is exactly" },
    { value: "has_value", label: "has value" },
    { value: "no_value", label: "is empty" },
  ],
};

type FilterCondition = {
  id: number;
  fieldKey: keyof ContactRecord;
  operator: Operator;
  value: string;
};

let nextFilterId = 1;

function getDefaultOp(type: FieldType): Operator {
  return OPS_BY_TYPE[type][0].value;
}

function needsValue(op: Operator): boolean {
  return ![
    "is_true", "is_false", "has_value", "no_value",
    "today", "tomorrow", "yesterday", "in_7_days", "in_30_days", "this_month",
  ].includes(op);
}

function getMMDD(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")}`;
}

function dateOffsetMMDD(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return getMMDD(d);
}

function getMMDDRange(days: number): string[] {
  const result: string[] = [];
  const now = new Date();
  for (let i = 0; i <= days; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    result.push(getMMDD(d));
  }
  return result;
}

function matchesDateOp(raw: unknown, operator: Operator, filterValue?: string): boolean {
  if (typeof raw !== "string" || !raw) return false;
  // Extract MM/DD from the stored value (could be "MM/DD" or "MM/DD/YYYY")
  const mmdd = raw.length >= 5 ? raw.substring(0, 5) : raw;

  if (operator === "today") return mmdd === getMMDD(new Date());
  if (operator === "tomorrow") return mmdd === dateOffsetMMDD(1);
  if (operator === "yesterday") return mmdd === dateOffsetMMDD(-1);
  if (operator === "in_7_days") return getMMDDRange(7).includes(mmdd);
  if (operator === "in_30_days") return getMMDDRange(30).includes(mmdd);
  if (operator === "on_date" && filterValue) {
    // filterValue is "YYYY-MM-DD" from date picker
    const [, fm, fd] = filterValue.split("-");
    if (!fm || !fd) return false;
    const targetMMDD = `${fm}/${fd}`;
    return mmdd === targetMMDD;
  }
  if (operator === "this_month") {
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, "0");
    return mmdd.startsWith(currentMonth + "/");
  }
  return false;
}

function matchesCondition(contact: ContactRecord, cond: FilterCondition): boolean {
  const raw = contact[cond.fieldKey];
  const { operator, value } = cond;

  if (operator === "has_value") return raw != null && raw !== "" && raw !== false;
  if (operator === "no_value") return raw == null || raw === "";
  if (operator === "is_true") return raw === true;
  if (operator === "is_false") return raw !== true;

  // Date-relative operators
  if (["today", "tomorrow", "yesterday", "in_7_days", "in_30_days", "this_month", "on_date"].includes(operator)) {
    return matchesDateOp(raw, operator, value);
  }

  if (raw == null) return false;
  const strVal = String(raw).toLowerCase();
  const target = value.toLowerCase();

  if (operator === "contains") return strVal.includes(target);
  if (operator === "does_not_contain") return !strVal.includes(target);
  if (operator === "is") return strVal === target;
  if (operator === "is_not") return strVal !== target;
  if (operator === "eq") return Number(raw) === Number(value);
  if (operator === "gte") return Number(raw) >= Number(value);
  if (operator === "lte") return Number(raw) <= Number(value);

  return true;
}

/* ── Badge colors ──────────────────────────────────────────────────── */

const CONTACT_COLORS: Record<string, { dot: string; badge: string }> = {
  Realtor: { dot: "#008BC7", badge: "realtor" },
  "Past Client": { dot: "#16a34a", badge: "pastClient" },
  Referral: { dot: "#c2410c", badge: "referral" },
  Lead: { dot: "#6d28d9", badge: "lead" },
  "Financial Advisor": { dot: "#0891b2", badge: "realtor" },
  CPA: { dot: "#059669", badge: "pastClient" },
  Attorney: { dot: "#7c3aed", badge: "lead" },
};

function getInitials(first: string, last: string) {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "??";
}

/* ── Main component ────────────────────────────────────────────────── */

export function ContactsViewClient({ data }: { data: ContactsPageData }) {
  const router = useRouter();
  const [modalContact, setModalContact] = useState<ContactRecord | null | "new">(null);
  const [searchText, setSearchText] = useState("");
  const [filters, setFilters] = useState<FilterCondition[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Unique values for autocomplete (derived from data)
  const uniqueValues = useMemo(() => {
    const map: Partial<Record<keyof ContactRecord, string[]>> = {};
    for (const def of FIELD_DEFS) {
      if (def.type === "text" || def.type === "date-text") {
        const vals = new Set<string>();
        for (const c of data.contacts) {
          const v = c[def.key];
          if (typeof v === "string" && v) vals.add(v);
        }
        if (vals.size > 0) map[def.key] = [...vals].sort();
      }
    }
    return map;
  }, [data.contacts]);

  // Apply search + filter conditions
  const filtered = useMemo(() => {
    let result = data.contacts;

    if (searchText) {
      const q = searchText.toLowerCase();
      result = result.filter(
        (c) =>
          `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q) ||
          (c.phone ?? "").toLowerCase().includes(q) ||
          (c.notes ?? "").toLowerCase().includes(q) ||
          (c.city ?? "").toLowerCase().includes(q) ||
          (c.state ?? "").toLowerCase().includes(q) ||
          (c.employment ?? "").toLowerCase().includes(q) ||
          (c.realtorName ?? "").toLowerCase().includes(q),
      );
    }

    for (const cond of filters) {
      result = result.filter((c) => matchesCondition(c, cond));
    }

    return result;
  }, [data.contacts, searchText, filters]);

  const addFilter = () => {
    const def = FIELD_DEFS[0];
    setFilters((prev) => [
      ...prev,
      { id: nextFilterId++, fieldKey: def.key, operator: getDefaultOp(def.type), value: "" },
    ]);
    setShowFilters(true);
  };

  const updateFilter = (id: number, updates: Partial<FilterCondition>) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    );
  };

  const removeFilter = (id: number) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAllFilters = () => {
    setFilters([]);
  };

  const badgeClass = (type: string) => {
    const col = CONTACT_COLORS[type];
    if (!col) return styles.ctBadgeRealtor;
    return styles[`ctBadge${col.badge.charAt(0).toUpperCase()}${col.badge.slice(1)}`] ?? styles.ctBadgeRealtor;
  };

  return (
    <>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <div className={styles.pageTitle}>Contacts</div>
          <div className={styles.pageMeta}>
            {filtered.length === data.totalCount
              ? `${data.totalCount} contact${data.totalCount === 1 ? "" : "s"}`
              : `${filtered.length} of ${data.totalCount} contacts`}
          </div>
        </div>
        <div className={styles.ctHeaderRight}>
          <button
            className={styles.actionButton}
            type="button"
            onClick={() => setModalContact("new")}
          >
            <Plus size={14} />
            Add Contact
          </button>
        </div>
      </div>

      {/* Search + filter bar */}
      <div style={{
        display: "flex",
        gap: 8,
        alignItems: "center",
        flexWrap: "wrap",
        marginBottom: 12,
      }}>
        <div className={styles.searchWrap} style={{ flex: "1 1 200px", minWidth: 180 }}>
          <Search size={14} className={styles.searchIcon} />
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search name, email, phone, city…"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          {searchText && (
            <button
              type="button"
              onClick={() => setSearchText("")}
              style={{
                border: "none", background: "transparent", color: "#8696aa",
                cursor: "pointer", padding: 4, display: "flex",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => { setShowFilters(!showFilters); if (!showFilters && filters.length === 0) addFilter(); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 14px",
            border: "1.5px solid",
            borderColor: filters.length > 0 ? "#008bc7" : "#d3e4ef",
            borderRadius: 10,
            background: filters.length > 0 ? "#e8f6fd" : "#fff",
            color: "#172852",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          <Filter size={14} />
          Filters
          {filters.length > 0 && (
            <span style={{
              background: "#008bc7", color: "#fff", borderRadius: 50,
              padding: "1px 7px", fontSize: 11, fontWeight: 700,
            }}>
              {filters.length}
            </span>
          )}
        </button>
      </div>

      {/* Filter builder panel */}
      {showFilters && (
        <div style={{
          padding: "14px 16px",
          background: "#fff",
          borderRadius: 14,
          border: "1.5px solid #e4eaf3",
          marginBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}>
          {filters.map((cond) => {
            const def = FIELD_DEFS.find((d) => d.key === cond.fieldKey) ?? FIELD_DEFS[0];
            const ops = OPS_BY_TYPE[def.type];
            const showValue = needsValue(cond.operator);
            const suggestions = (def.type === "text" || def.type === "date-text")
              ? uniqueValues[def.key] ?? []
              : [];

            return (
              <div key={cond.id} style={{
                display: "flex",
                gap: 6,
                alignItems: "center",
                flexWrap: "wrap",
              }}>
                {/* Field picker */}
                <select
                  className={styles.filterSelect}
                  value={cond.fieldKey}
                  onChange={(e) => {
                    const newKey = e.target.value as keyof ContactRecord;
                    const newDef = FIELD_DEFS.find((d) => d.key === newKey) ?? FIELD_DEFS[0];
                    updateFilter(cond.id, {
                      fieldKey: newKey,
                      operator: getDefaultOp(newDef.type),
                      value: "",
                    });
                  }}
                  style={{ minWidth: 130 }}
                >
                  {FIELD_DEFS.map((d) => (
                    <option key={d.key} value={d.key}>{d.label}</option>
                  ))}
                </select>

                {/* Operator picker */}
                <select
                  className={styles.filterSelect}
                  value={cond.operator}
                  onChange={(e) => updateFilter(cond.id, { operator: e.target.value as Operator })}
                  style={{ minWidth: 90 }}
                >
                  {ops.map((op) => (
                    <option key={op.value} value={op.value}>{op.label}</option>
                  ))}
                </select>

                {/* Value input */}
                {showValue && (
                  cond.operator === "on_date" ? (
                    <input
                      type="date"
                      className={styles.filterSelect}
                      value={cond.value}
                      onChange={(e) => updateFilter(cond.id, { value: e.target.value })}
                      style={{ minWidth: 140 }}
                    />
                  ) : def.type === "enum" && def.options ? (
                    <select
                      className={styles.filterSelect}
                      value={cond.value}
                      onChange={(e) => updateFilter(cond.id, { value: e.target.value })}
                      style={{ minWidth: 120 }}
                    >
                      <option value="">Select…</option>
                      {def.options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : def.type === "number" ? (
                    <input
                      type="number"
                      className={styles.filterSelect}
                      placeholder="Value"
                      value={cond.value}
                      onChange={(e) => updateFilter(cond.id, { value: e.target.value })}
                      style={{ minWidth: 80, width: 100 }}
                    />
                  ) : suggestions.length > 0 ? (
                    <>
                      <input
                        type="text"
                        className={styles.filterSelect}
                        list={`dl-${cond.id}`}
                        placeholder="Value"
                        value={cond.value}
                        onChange={(e) => updateFilter(cond.id, { value: e.target.value })}
                        style={{ minWidth: 120 }}
                      />
                      <datalist id={`dl-${cond.id}`}>
                        {suggestions.map((s) => (
                          <option key={s} value={s} />
                        ))}
                      </datalist>
                    </>
                  ) : (
                    <input
                      type="text"
                      className={styles.filterSelect}
                      placeholder="Value"
                      value={cond.value}
                      onChange={(e) => updateFilter(cond.id, { value: e.target.value })}
                      style={{ minWidth: 120 }}
                    />
                  )
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeFilter(cond.id)}
                  style={{
                    border: "none", background: "transparent", color: "#8696aa",
                    cursor: "pointer", padding: 4, display: "flex",
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            );
          })}

          {/* Add + Clear row */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 4 }}>
            <button
              type="button"
              onClick={addFilter}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                border: "1.5px solid #d3e4ef",
                borderRadius: 8,
                background: "#fff",
                color: "#008bc7",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <Plus size={12} />
              Add Filter
            </button>
            {filters.length > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                style={{
                  border: "none", background: "transparent", color: "#8696aa",
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Clear All
              </button>
            )}
          </div>
        </div>
      )}

      {/* Active filter chips (shown when panel is closed) */}
      {!showFilters && filters.length > 0 && (
        <div style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          alignItems: "center",
          marginBottom: 12,
        }}>
          {filters.map((cond) => {
            const def = FIELD_DEFS.find((d) => d.key === cond.fieldKey);
            const opLabel = OPS_BY_TYPE[def?.type ?? "text"].find((o) => o.value === cond.operator)?.label ?? cond.operator;
            const display = needsValue(cond.operator)
              ? `${def?.label ?? cond.fieldKey} ${opLabel} "${cond.value}"`
              : `${def?.label ?? cond.fieldKey} ${opLabel}`;
            return (
              <FilterChip key={cond.id} label={display} onRemove={() => removeFilter(cond.id)} />
            );
          })}
          <button
            type="button"
            onClick={clearAllFilters}
            style={{
              border: "none", background: "transparent", color: "#008bc7",
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              padding: "4px 8px",
            }}
          >
            Clear All
          </button>
        </div>
      )}

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <div className={styles.ctEmpty}>
          {data.totalCount === 0 ? (
            <>
              <Users size={32} />
              <h3>No contacts yet</h3>
              <p>Contacts are created when you log activities, or add them manually.</p>
            </>
          ) : (
            <>
              <h3>No results</h3>
              <p>No contacts match your filters.</p>
            </>
          )}
        </div>
      ) : (
        <div className={styles.ctGrid}>
          {filtered.map((c) => (
            <div
              key={c.id}
              className={styles.ctCard}
              onClick={() => router.push(`/contacts/${c.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") router.push(`/contacts/${c.id}`);
              }}
            >
              <div className={styles.ctCardTop}>
                <div className={styles.ctAvatar}>
                  {getInitials(c.firstName, c.lastName)}
                </div>
                <span className={badgeClass(c.contactType)}>{c.contactType}</span>
              </div>
              <div className={styles.ctName}>
                {c.firstName} {c.lastName}
              </div>
              {c.email && (
                <div className={styles.ctDetail}>
                  <Mail size={11} />
                  {c.email}
                </div>
              )}
              {c.phone && (
                <div className={styles.ctDetail}>
                  <Phone size={11} />
                  {c.phone}
                </div>
              )}
              {(c.city || c.state) && (
                <div className={styles.ctDetail} style={{ color: "#8696aa" }}>
                  {[c.city, c.state].filter(Boolean).join(", ")}
                </div>
              )}
              {c.phone && (
                <div className={styles.ctActions} onClick={(e) => e.stopPropagation()}>
                  <a href={`tel:${c.phone}`} className={styles.ctActionBtn} aria-label="Call">
                    <Phone size={14} />
                    Call
                  </a>
                  <a href={`sms:${c.phone}`} className={styles.ctActionBtn} aria-label="Text">
                    <MessageSquare size={14} />
                    Text
                  </a>
                </div>
              )}
              {c.notes && <div className={styles.ctNotesPreview}>{c.notes}</div>}
              {c.activityCount > 0 && (
                <div className={styles.ctActivityBadge}>
                  {c.activityCount} activit{c.activityCount === 1 ? "y" : "ies"}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalContact !== null && (
        <ContactModal
          contact={modalContact === "new" ? null : modalContact}
          onClose={() => setModalContact(null)}
        />
      )}
    </>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 4,
      padding: "4px 10px",
      background: "#e8f6fd",
      borderRadius: 50,
      fontSize: 12,
      fontWeight: 600,
      color: "#008bc7",
    }}>
      {label}
      <button
        type="button"
        onClick={onRemove}
        style={{
          border: "none", background: "transparent", color: "#008bc7",
          cursor: "pointer", padding: 0, display: "flex",
        }}
      >
        <X size={12} />
      </button>
    </span>
  );
}
