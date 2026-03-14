"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveOrUpdateContact, deleteContact } from "@/lib/db/tracker-actions";
import type { ContactRecord } from "@/lib/db/tracker";
import styles from "./tracker-shell.module.css";

type ContactModalProps = {
  contact: ContactRecord | null;
  onClose: () => void;
};

export function ContactModal({ contact, onClose }: ContactModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const firstRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(contact?.firstName ?? "");
  const [lastName, setLastName] = useState(contact?.lastName ?? "");
  const [contactType, setContactType] = useState(contact?.contactType ?? "");
  const [email, setEmail] = useState(contact?.email ?? "");
  const [phone, setPhone] = useState(contact?.phone ?? "");
  const [notes, setNotes] = useState(contact?.notes ?? "");

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
