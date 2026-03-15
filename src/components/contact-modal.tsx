"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Shield } from "lucide-react";
import { saveOrUpdateContact, searchRealtors, deleteContact } from "@/lib/db/tracker-actions";
import type { ContactRecord } from "@/lib/db/tracker";
import styles from "./tracker-shell.module.css";

type ContactModalProps = {
  contact: ContactRecord | null;
  onClose: () => void;
};

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export function ContactModal({ contact, onClose }: ContactModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const firstRef = useRef<HTMLInputElement>(null);
  const [showAllFields, setShowAllFields] = useState(false);

  // Core fields
  const [firstName, setFirstName] = useState(contact?.firstName ?? "");
  const [lastName, setLastName] = useState(contact?.lastName ?? "");
  const [contactType, setContactType] = useState(contact?.contactType ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");

  // Extended fields
  const [dob, setDob] = useState(contact?.dob ?? "");
  const [city, setCity] = useState(contact?.city ?? "");
  const [state, setState] = useState(contact?.state ?? "");
  const [homeAnniversary, setHomeAnniversary] = useState(contact?.homeAnniversary ?? "");
  const [creditScore, setCreditScore] = useState(contact?.creditScore?.toString() ?? "");
  const [downPayment, setDownPayment] = useState(contact?.downPayment ?? "");
  const [timeline, setTimeline] = useState(contact?.timeline ?? "");
  const [employment, setEmployment] = useState(contact?.employment ?? "");
  const [income, setIncome] = useState(contact?.income ?? "");
  const [realtorName, setRealtorName] = useState(contact?.realtorName ?? "");
  const [realtorId, setRealtorId] = useState(contact?.realtorId ?? "");
  const [militaryVeteran, setMilitaryVeteran] = useState(contact?.militaryVeteran ?? false);

  // Realtor autocomplete
  const [realtorSuggestions, setRealtorSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [showRealtorDropdown, setShowRealtorDropdown] = useState(false);
  const realtorTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-expand if editing and any extended fields have data
  useEffect(() => {
    if (contact) {
      const hasExtended = !!(
        contact.dob || contact.city || contact.state || contact.homeAnniversary ||
        contact.creditScore || contact.downPayment || contact.timeline ||
        contact.employment || contact.income || contact.realtorName || contact.militaryVeteran
      );
      if (hasExtended) setShowAllFields(true);
    }
  }, [contact]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    setTimeout(() => firstRef.current?.focus(), 100);
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const handleRealtorSearch = (val: string) => {
    setRealtorName(val);
    setRealtorId("");
    if (realtorTimeout.current) clearTimeout(realtorTimeout.current);
    if (val.length < 2) {
      setRealtorSuggestions([]);
      setShowRealtorDropdown(false);
      return;
    }
    realtorTimeout.current = setTimeout(async () => {
      const results = await searchRealtors(val);
      setRealtorSuggestions(results);
      setShowRealtorDropdown(results.length > 0);
    }, 300);
  };

  const selectRealtor = (r: { id: string; name: string }) => {
    setRealtorName(r.name);
    setRealtorId(r.id);
    setShowRealtorDropdown(false);
  };

  const handleSave = () => {
    if (!firstName.trim()) {
      setError("Please enter a first name.");
      firstRef.current?.focus();
      return;
    }
    if (!lastName.trim()) {
      setError("Please enter a last name.");
      return;
    }
    if (!contactType) {
      setError("Please select a contact type.");
      return;
    }
    setError("");

    startTransition(async () => {
      const result = await saveOrUpdateContact({
        id: contact?.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        contactType,
        email: email.trim(),
        phone: phone.trim(),
        notes: notes.trim(),
        dob: dob.trim(),
        city: city.trim(),
        state: state.trim(),
        homeAnniversary: homeAnniversary.trim(),
        creditScore: creditScore ? creditScore : "",
        downPayment: downPayment.trim(),
        timeline: timeline.trim(),
        employment: employment.trim(),
        income: income.trim(),
        realtorName: realtorName.trim(),
        realtorId: realtorId.trim(),
        militaryVeteran,
      });

      if (!result.success) {
        setError(result.error ?? "Failed to save.");
        return;
      }

      router.refresh();
      onClose();
    });
  };

  const handleDelete = () => {
    if (!contact?.id) return;
    if (!confirm(`Delete ${contact.firstName} ${contact.lastName} from contacts?`)) return;

    startTransition(async () => {
      const result = await deleteContact(contact.id);
      if (!result.success) {
        setError(result.error ?? "Failed to delete.");
        return;
      }
      router.refresh();
      onClose();
    });
  };

  return (
    <div className={`${styles.cmOverlay} ${styles.cmOverlayOpen}`} onClick={handleOverlayClick}>
      <div className={styles.cmModal}>
        <button className={styles.cmClose} onClick={onClose} type="button">
          &times;
        </button>
        <div className={styles.cmTitle}>{contact ? "Edit Contact" : "Add Contact"}</div>
        <div className={styles.cmSub}>
          {contact ? "Update contact details" : "Save a contact to your CRM"}
        </div>

        {error && <div className={styles.cmError}>{error}</div>}

        {/* Core fields — always visible */}
        <div className={styles.cmGrid2}>
          <div className={styles.cmField}>
            <label className={styles.cmLabel}>First Name *</label>
            <input
              ref={firstRef}
              className={styles.cmInput}
              type="text"
              placeholder="Jane"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className={styles.cmField}>
            <label className={styles.cmLabel}>Last Name *</label>
            <input
              className={styles.cmInput}
              type="text"
              placeholder="Smith"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.cmField}>
          <label className={styles.cmLabel}>Contact Type *</label>
          <select
            className={`${styles.cmInput} ${styles.cmSelect}`}
            value={contactType}
            onChange={(e) => setContactType(e.target.value)}
          >
            <option value="">Select type&hellip;</option>
            <option>Realtor</option>
            <option>Past Client</option>
            <option>Referral</option>
            <option>Lead</option>
            <option>Financial Advisor</option>
            <option>CPA</option>
            <option>Attorney</option>
          </select>
        </div>

        <div className={styles.cmGrid2}>
          <div className={styles.cmField}>
            <label className={styles.cmLabel}>Email</label>
            <input
              className={styles.cmInput}
              type="email"
              placeholder="jane@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className={styles.cmField}>
            <label className={styles.cmLabel}>Phone</label>
            <input
              className={styles.cmInput}
              type="tel"
              placeholder="(337) 555-1234"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.cmField}>
          <label className={styles.cmLabel}>Notes</label>
          <textarea
            className={styles.cmTextarea}
            placeholder="Add any notes…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Toggle for extended fields */}
        <button
          type="button"
          onClick={() => setShowAllFields(!showAllFields)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            width: "100%",
            padding: "10px 0",
            border: "none",
            background: "transparent",
            color: "#008bc7",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          {showAllFields ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showAllFields ? "Hide Extra Fields" : "Show All Fields"}
        </button>

        {/* Extended fields — shown when toggled */}
        {showAllFields && (
          <>
            {/* Personal */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8696aa", textTransform: "uppercase", letterSpacing: "0.06em", margin: "4px 0 8px" }}>
              Personal
            </div>
            <div className={styles.cmGrid2}>
              <div className={styles.cmField}>
                <label className={styles.cmLabel}>Date of Birth</label>
                <input
                  className={styles.cmInput}
                  type="text"
                  placeholder="MM/DD or MM/DD/YYYY"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                />
              </div>
              <div className={styles.cmField}>
                <label className={styles.cmLabel} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Shield size={12} /> Military / Veteran
                </label>
                <button
                  type="button"
                  onClick={() => setMilitaryVeteran(!militaryVeteran)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "10px 14px",
                    border: "1.5px solid",
                    borderColor: militaryVeteran ? "#008bc7" : "#d3e4ef",
                    borderRadius: 10,
                    background: militaryVeteran ? "#e8f6fd" : "#fff",
                    color: "#172852",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: 6,
                    border: "2px solid",
                    borderColor: militaryVeteran ? "#008bc7" : "#d3e4ef",
                    background: militaryVeteran ? "#008bc7" : "#fff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 12, fontWeight: 800, flexShrink: 0,
                  }}>
                    {militaryVeteran ? "✓" : ""}
                  </span>
                  {militaryVeteran ? "Yes" : "No"}
                </button>
              </div>
            </div>

            {/* Location */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8696aa", textTransform: "uppercase", letterSpacing: "0.06em", margin: "12px 0 8px" }}>
              Location
            </div>
            <div className={styles.cmGrid2}>
              <div className={styles.cmField}>
                <label className={styles.cmLabel}>City</label>
                <input
                  className={styles.cmInput}
                  type="text"
                  placeholder="Lafayette"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className={styles.cmField}>
                <label className={styles.cmLabel}>State</label>
                <select
                  className={`${styles.cmInput} ${styles.cmSelect}`}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                >
                  <option value="">Select…</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Financial */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8696aa", textTransform: "uppercase", letterSpacing: "0.06em", margin: "12px 0 8px" }}>
              Financial
            </div>
            <div className={styles.cmGrid2}>
              <div className={styles.cmField}>
                <label className={styles.cmLabel}>Credit Score</label>
                <input
                  className={styles.cmInput}
                  type="number"
                  placeholder="720"
                  min={300}
                  max={850}
                  value={creditScore}
                  onChange={(e) => setCreditScore(e.target.value)}
                />
              </div>
              <div className={styles.cmField}>
                <label className={styles.cmLabel}>Down Payment</label>
                <input
                  className={styles.cmInput}
                  type="text"
                  placeholder="$10k or 20%"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                />
              </div>
            </div>
            <div className={styles.cmGrid2}>
              <div className={styles.cmField}>
                <label className={styles.cmLabel}>Employment</label>
                <input
                  className={styles.cmInput}
                  type="text"
                  placeholder="Company / Title"
                  value={employment}
                  onChange={(e) => setEmployment(e.target.value)}
                />
              </div>
              <div className={styles.cmField}>
                <label className={styles.cmLabel}>Income</label>
                <input
                  className={styles.cmInput}
                  type="text"
                  placeholder="$85k/yr"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                />
              </div>
            </div>

            {/* Home */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8696aa", textTransform: "uppercase", letterSpacing: "0.06em", margin: "12px 0 8px" }}>
              Home
            </div>
            <div className={styles.cmGrid2}>
              <div className={styles.cmField}>
                <label className={styles.cmLabel}>Home Anniversary</label>
                <input
                  className={styles.cmInput}
                  type="text"
                  placeholder="MM/DD or MM/DD/YYYY"
                  value={homeAnniversary}
                  onChange={(e) => setHomeAnniversary(e.target.value)}
                />
              </div>
              <div className={styles.cmField}>
                <label className={styles.cmLabel}>Timeline</label>
                <input
                  className={styles.cmInput}
                  type="text"
                  placeholder="3 months, ASAP…"
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                />
              </div>
            </div>

            {/* Realtor */}
            <div style={{ fontSize: 10, fontWeight: 700, color: "#8696aa", textTransform: "uppercase", letterSpacing: "0.06em", margin: "12px 0 8px" }}>
              Realtor
            </div>
            <div className={styles.cmField} style={{ position: "relative" }}>
              <label className={styles.cmLabel}>Realtor Name</label>
              <input
                className={styles.cmInput}
                type="text"
                placeholder="Search or type name…"
                value={realtorName}
                onChange={(e) => handleRealtorSearch(e.target.value)}
                onBlur={() => setTimeout(() => setShowRealtorDropdown(false), 200)}
              />
              {showRealtorDropdown && (
                <div style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  background: "#fff",
                  border: "1.5px solid #d3e4ef",
                  borderRadius: 10,
                  boxShadow: "0 4px 16px rgba(23,40,82,0.12)",
                  zIndex: 10,
                  maxHeight: 160,
                  overflowY: "auto",
                }}>
                  {realtorSuggestions.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectRealtor(r)}
                      style={{
                        display: "block",
                        width: "100%",
                        padding: "10px 14px",
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#172852",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        borderBottom: "1px solid #f0f3f8",
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      {r.name}
                    </button>
                  ))}
                </div>
              )}
              {realtorId && (
                <div style={{ fontSize: 11, color: "#008bc7", marginTop: 4, fontWeight: 600 }}>
                  Linked to contact record
                </div>
              )}
            </div>
          </>
        )}

        <div className={styles.cmActions}>
          <button className={styles.cmBtnCancel} onClick={onClose} type="button">
            Cancel
          </button>
          <button className={styles.cmBtnSave} onClick={handleSave} disabled={isPending} type="button">
            {isPending ? "Saving…" : "Save Contact"}
          </button>
        </div>

        {contact && (
          <div className={styles.cmDeleteWrap}>
            <button
              className={styles.cmBtnDelete}
              onClick={handleDelete}
              disabled={isPending}
              type="button"
            >
              Delete this contact
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
