"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowLeft,
  Mail,
  MessageSquare,
  Phone,
  Trash2,
  Edit3,
} from "lucide-react";
import type { ContactDetailData } from "@/lib/db/tracker";
import { deleteContact } from "@/lib/db/tracker-actions";
import { ContactModal } from "@/components/contact-modal";
import styles from "./contact-detail.module.css";

const METRIC_ICONS: Record<string, string> = {
  calls: "Calls",
  convs: "Conversations",
  leads: "Leads",
  credits: "Credit Pulls",
};

export function ContactDetailView({ data }: { data: ContactDetailData }) {
  const { contact, activities } = data;
  const router = useRouter();
  const [showEdit, setShowEdit] = useState(false);
  const [isPending, startTransition] = useTransition();

  const initials = ((contact.firstName?.[0] ?? "") + (contact.lastName?.[0] ?? "")).toUpperCase() || "??";
  const fullName = `${contact.firstName} ${contact.lastName}`.trim();

  const handleDelete = () => {
    if (!confirm(`Delete ${fullName}?`)) return;
    startTransition(async () => {
      await deleteContact(contact.id);
      router.push("/contacts");
    });
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/contacts" className={styles.backBtn}>
          <ArrowLeft size={18} />
          Contacts
        </Link>
        <div className={styles.headerActions}>
          <button className={styles.editBtn} onClick={() => setShowEdit(true)}>
            <Edit3 size={14} />
            Edit
          </button>
          <button className={styles.deleteBtn} onClick={handleDelete} disabled={isPending}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className={styles.profileCard}>
        <div className={styles.avatar}>{initials}</div>
        <h1 className={styles.name}>{fullName}</h1>
        <span className={styles.typeBadge}>{contact.contactType}</span>

        {/* Action buttons */}
        <div className={styles.actionRow}>
          {contact.phone && (
            <>
              <a href={`tel:${contact.phone}`} className={styles.actionBtn}>
                <Phone size={18} />
                <span>Call</span>
              </a>
              <a href={`sms:${contact.phone}`} className={styles.actionBtn}>
                <MessageSquare size={18} />
                <span>Text</span>
              </a>
            </>
          )}
          {contact.email && (
            <a href={`mailto:${contact.email}`} className={styles.actionBtn}>
              <Mail size={18} />
              <span>Email</span>
            </a>
          )}
        </div>
      </div>

      {/* Info section */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Details</h2>
        <div className={styles.infoCard}>
          {contact.phone && (
            <div className={styles.infoRow}>
              <Phone size={14} className={styles.infoIcon} />
              <div>
                <div className={styles.infoLabel}>Phone</div>
                <div className={styles.infoValue}>{contact.phone}</div>
              </div>
            </div>
          )}
          {contact.email && (
            <div className={styles.infoRow}>
              <Mail size={14} className={styles.infoIcon} />
              <div>
                <div className={styles.infoLabel}>Email</div>
                <div className={styles.infoValue}>{contact.email}</div>
              </div>
            </div>
          )}
          {contact.notes && (
            <div className={styles.infoRow}>
              <div>
                <div className={styles.infoLabel}>Notes</div>
                <div className={styles.infoValue}>{contact.notes}</div>
              </div>
            </div>
          )}
          <div className={styles.infoRow}>
            <div>
              <div className={styles.infoLabel}>Added</div>
              <div className={styles.infoValue}>
                {new Date(contact.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity history */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Activity History
          <span className={styles.activityCount}>{activities.length}</span>
        </h2>
        {activities.length === 0 ? (
          <div className={styles.emptyState}>No activities logged with this contact yet.</div>
        ) : (
          <div className={styles.activityList}>
            {activities.map((a) => (
              <div key={a.id} className={styles.activityItem}>
                <div className={styles.activityLeft}>
                  <div className={styles.activityMetric}>{METRIC_ICONS[a.metric] ?? a.metric}</div>
                  <div className={styles.activityType}>{a.type}</div>
                </div>
                <div className={styles.activityRight}>
                  <div className={styles.activityDate}>
                    {new Date(a.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                  <div className={styles.activityTime}>{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <ContactModal contact={contact} onClose={() => setShowEdit(false)} />
      )}
    </div>
  );
}
