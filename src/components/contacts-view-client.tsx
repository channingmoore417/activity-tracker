"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, MessageSquare, Phone, Plus, Search, Users } from "lucide-react";
import { ContactModal } from "@/components/contact-modal";
import type { ContactRecord, ContactsPageData } from "@/lib/db/tracker";
import styles from "./tracker-shell.module.css";

const CONTACT_TYPES = ["Realtor", "Past Client", "Referral", "Lead"] as const;
const CONTACT_COLORS: Record<string, { dot: string; badge: string }> = {
  Realtor: { dot: "#008BC7", badge: "realtor" },
  "Past Client": { dot: "#16a34a", badge: "pastClient" },
  Referral: { dot: "#c2410c", badge: "referral" },
  Lead: { dot: "#6d28d9", badge: "lead" },
};

function getInitials(first: string, last: string) {
  return ((first?.[0] ?? "") + (last?.[0] ?? "")).toUpperCase() || "??";
}

export function ContactsViewClient({ data }: { data: ContactsPageData }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentType = searchParams.get("type") ?? "";
  const currentSearch = searchParams.get("search") ?? "";

  const [modalContact, setModalContact] = useState<ContactRecord | null | "new">(null);

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
            {data.totalCount} contact{data.totalCount === 1 ? "" : "s"}
          </div>
        </div>
        <div className={styles.ctHeaderRight}>
          <form className={styles.searchWrap} action="/contacts" method="get">
            <Search size={14} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              name="search"
              type="text"
              placeholder="Search contacts…"
              defaultValue={currentSearch}
            />
            {currentType && <input type="hidden" name="type" value={currentType} />}
          </form>
          <form action="/contacts" method="get">
            {currentSearch && <input type="hidden" name="search" value={currentSearch} />}
            <select
              className={styles.filterSelect}
              name="type"
              defaultValue={currentType}
              onChange={(e) => (e.target.form as HTMLFormElement)?.submit()}
            >
              <option value="">All Types</option>
              {CONTACT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </form>
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

      {/* Type strip */}
      <div className={styles.ctTypeStrip}>
        {CONTACT_TYPES.map((t) => {
          const col = CONTACT_COLORS[t]!;
          const isActive = currentType === t;
          const href = isActive
            ? `/contacts${currentSearch ? `?search=${encodeURIComponent(currentSearch)}` : ""}`
            : `/contacts?type=${encodeURIComponent(t)}${currentSearch ? `&search=${encodeURIComponent(currentSearch)}` : ""}`;

          return (
            <Link
              key={t}
              href={href}
              className={`${styles.ctTypePill} ${isActive ? styles.ctTypePillActive : ""}`}
            >
              <span className={styles.ctTypeDot} style={{ background: col.dot }} />
              <span className={styles.ctTypePillLabel}>{t}</span>
              <span className={styles.ctTypePillCount}>{data.typeCounts[t] ?? 0}</span>
            </Link>
          );
        })}
      </div>

      {/* Grid or empty state */}
      {data.contacts.length === 0 ? (
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
              <p>No contacts match your search.</p>
            </>
          )}
        </div>
      ) : (
        <div className={styles.ctGrid}>
          {data.contacts.map((c) => {
            const col = CONTACT_COLORS[c.contactType] ?? CONTACT_COLORS.Realtor!;
            return (
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
            );
          })}
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
