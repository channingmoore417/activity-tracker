"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Filter, Mail, MessageSquare, Phone, Plus, Search, Users, X } from "lucide-react";
import { ContactModal } from "@/components/contact-modal";
import type { ContactRecord, ContactsPageData } from "@/lib/db/tracker";
import styles from "./tracker-shell.module.css";

const CONTACT_TYPES = ["Realtor", "Past Client", "Referral", "Lead", "Financial Advisor", "CPA", "Attorney"] as const;
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

export function ContactsViewClient({ data }: { data: ContactsPageData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialType = searchParams.get("type") ?? "";
  const initialSearch = searchParams.get("search") ?? "";

  const [modalContact, setModalContact] = useState<ContactRecord | null | "new">(null);

  // Client-side filter state
  const [searchText, setSearchText] = useState(initialSearch);
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [stateFilter, setStateFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [militaryFilter, setMilitaryFilter] = useState(false);
  const [hasCreditScore, setHasCreditScore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Derive unique values for filter dropdowns
  const uniqueStates = useMemo(() => {
    const states = new Set<string>();
    for (const c of data.contacts) {
      if (c.state) states.add(c.state);
    }
    return [...states].sort();
  }, [data.contacts]);

  const uniqueCities = useMemo(() => {
    const cities = new Set<string>();
    for (const c of data.contacts) {
      if (c.city) cities.add(c.city);
    }
    return [...cities].sort();
  }, [data.contacts]);

  // Client-side filtering
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
          (c.employment ?? "").toLowerCase().includes(q) ||
          (c.realtorName ?? "").toLowerCase().includes(q),
      );
    }

    if (typeFilter) {
      result = result.filter((c) => c.contactType === typeFilter);
    }
    if (stateFilter) {
      result = result.filter((c) => c.state === stateFilter);
    }
    if (cityFilter) {
      result = result.filter((c) => c.city === cityFilter);
    }
    if (militaryFilter) {
      result = result.filter((c) => c.militaryVeteran === true);
    }
    if (hasCreditScore) {
      result = result.filter((c) => c.creditScore != null);
    }

    return result;
  }, [data.contacts, searchText, typeFilter, stateFilter, cityFilter, militaryFilter, hasCreditScore]);

  const activeFilterCount = [typeFilter, stateFilter, cityFilter, militaryFilter, hasCreditScore].filter(Boolean).length;

  const clearAllFilters = () => {
    setTypeFilter("");
    setStateFilter("");
    setCityFilter("");
    setMilitaryFilter(false);
    setHasCreditScore(false);
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
          onClick={() => setShowFilters(!showFilters)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 14px",
            border: "1.5px solid",
            borderColor: activeFilterCount > 0 ? "#008bc7" : "#d3e4ef",
            borderRadius: 10,
            background: activeFilterCount > 0 ? "#e8f6fd" : "#fff",
            color: "#172852",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "border-color 0.15s",
          }}
        >
          <Filter size={14} />
          Filters
          {activeFilterCount > 0 && (
            <span style={{
              background: "#008bc7", color: "#fff", borderRadius: 50,
              padding: "1px 7px", fontSize: 11, fontWeight: 700,
            }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Expandable filter panel */}
      {showFilters && (
        <div style={{
          display: "flex",
          gap: 8,
          flexWrap: "wrap",
          alignItems: "center",
          padding: "12px 16px",
          background: "#fff",
          borderRadius: 14,
          border: "1.5px solid #e4eaf3",
          marginBottom: 16,
        }}>
          {/* Type */}
          <select
            className={styles.filterSelect}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            {CONTACT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t} ({data.typeCounts[t] ?? 0})
              </option>
            ))}
          </select>

          {/* State */}
          {uniqueStates.length > 0 && (
            <select
              className={styles.filterSelect}
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
            >
              <option value="">All States</option>
              {uniqueStates.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}

          {/* City */}
          {uniqueCities.length > 0 && (
            <select
              className={styles.filterSelect}
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="">All Cities</option>
              {uniqueCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}

          {/* Military toggle */}
          <button
            type="button"
            onClick={() => setMilitaryFilter(!militaryFilter)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              border: "1.5px solid",
              borderColor: militaryFilter ? "#008bc7" : "#d3e4ef",
              borderRadius: 10,
              background: militaryFilter ? "#e8f6fd" : "#fff",
              color: "#172852",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Military/Vet
          </button>

          {/* Has Credit Score */}
          <button
            type="button"
            onClick={() => setHasCreditScore(!hasCreditScore)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              border: "1.5px solid",
              borderColor: hasCreditScore ? "#008bc7" : "#d3e4ef",
              borderRadius: 10,
              background: hasCreditScore ? "#e8f6fd" : "#fff",
              color: "#172852",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Has Credit Score
          </button>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAllFilters}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "8px 12px",
                border: "none",
                background: "transparent",
                color: "#008bc7",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              <X size={12} />
              Clear All
            </button>
          )}
        </div>
      )}

      {/* Active filter chips (shown even when panel is closed) */}
      {!showFilters && activeFilterCount > 0 && (
        <div style={{
          display: "flex",
          gap: 6,
          flexWrap: "wrap",
          marginBottom: 12,
        }}>
          {typeFilter && (
            <FilterChip label={typeFilter} onRemove={() => setTypeFilter("")} />
          )}
          {stateFilter && (
            <FilterChip label={stateFilter} onRemove={() => setStateFilter("")} />
          )}
          {cityFilter && (
            <FilterChip label={cityFilter} onRemove={() => setCityFilter("")} />
          )}
          {militaryFilter && (
            <FilterChip label="Military/Vet" onRemove={() => setMilitaryFilter(false)} />
          )}
          {hasCreditScore && (
            <FilterChip label="Has Credit Score" onRemove={() => setHasCreditScore(false)} />
          )}
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
