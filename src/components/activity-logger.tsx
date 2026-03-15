"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Minus,
  Plus,
  Save,
  UserPlus,
  X,
} from "lucide-react";
import { metricCatalog } from "@/lib/tracker-data";
import type { MetricKey } from "@/lib/tracker-data";
import { logActivity, saveContact } from "@/lib/db/tracker-actions";
import type { LogActivityResult } from "@/lib/db/tracker-actions";
import styles from "./activity-logger.module.css";

type Step = "metric" | "subtype" | "input" | "success";

const conversationTypes = [
  "Phone Conversation",
  "Text Conversation",
  "Face-to-Face Meeting",
  "Open House",
  "Event",
];

const leadSources = [
  "Referral",
  "Open House",
  "Social Media",
  "Website",
  "Cold Call",
  "Other",
];

function getSubtypeOptions(metric: MetricKey): string[] {
  if (metric === "convs") return conversationTypes;
  if (metric === "leads") return leadSources;
  return [];
}

function needsSubtype(metric: MetricKey) {
  return metric === "convs" || metric === "leads";
}

function needsContactName(metric: MetricKey) {
  return metric !== "calls" && metric !== "social_posts" && metric !== "social_engagements";
}

function isCountOnly(metric: MetricKey) {
  return metric === "calls" || metric === "social_posts" || metric === "social_engagements";
}

function getActivityType(metric: MetricKey, subtype: string) {
  if (metric === "calls") return "Call";
  if (metric === "credits") return "Credit Pull";
  if (metric === "social_posts") return "Social Post";
  if (metric === "social_engagements") return "Social Engagement";
  return subtype;
}

export function ActivityLogger() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("metric");
  const [metric, setMetric] = useState<MetricKey | null>(null);
  const [subtype, setSubtype] = useState("");
  const [contactName, setContactName] = useState("");
  const [count, setCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<LogActivityResult | null>(null);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [contactSaved, setContactSaved] = useState(false);

  const reset = useCallback(() => {
    setStep("metric");
    setMetric(null);
    setSubtype("");
    setContactName("");
    setCount(1);
    setIsSubmitting(false);
    setResult(null);
    setIsSavingContact(false);
    setContactSaved(false);
  }, []);

  function handleOpen() {
    reset();
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    if (result?.success) {
      router.refresh();
    }
  }

  function handleMetricSelect(key: MetricKey) {
    setMetric(key);
    setTimeout(() => {
      if (needsSubtype(key)) {
        setStep("subtype");
      } else {
        setStep("input");
      }
    }, 220);
  }

  function handleSubtypeSelect(value: string) {
    setSubtype(value);
    setStep("input");
  }

  async function handleLog() {
    if (!metric) return;

    setIsSubmitting(true);

    const activityType = getActivityType(metric, subtype);
    const res = await logActivity({
      metric,
      contactName: needsContactName(metric) ? contactName : "",
      activityType,
      count: isCountOnly(metric) ? count : 1,
    });

    setResult(res);
    setIsSubmitting(false);

    if (res.success) {
      setStep("success");
    }
  }

  async function handleSaveContact() {
    if (!result?.contactName || !result.metric) return;

    setIsSavingContact(true);
    const res = await saveContact({
      contactName: result.contactName,
      metric: result.metric,
    });
    setIsSavingContact(false);

    if (res.success) {
      setContactSaved(true);
    }
  }

  const canLog =
    isCountOnly(metric!) ||
    (needsContactName(metric!) && contactName.trim().length > 0);

  return (
    <>
      <button className={styles.logButton} onClick={handleOpen} type="button">
        <Plus size={16} />
        Record Activity
      </button>
      <button className={styles.fab} onClick={handleOpen} type="button" aria-label="Record Activity">
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {open ? (
        <div className={styles.overlay} onClick={handleClose}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitle}>
                <Plus size={16} />
                {step === "success" ? "Activity Logged" : "Record Activity"}
              </div>
              <button className={styles.closeButton} onClick={handleClose} type="button">
                <X size={16} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {step === "metric" ? (
                <>
                  <div className={styles.stepLabel}>Step 1 — Choose Metric</div>
                  <div className={styles.metricGrid}>
                    {metricCatalog.map((item) => {
                      const Icon = item.icon;
                      const isActive = metric === item.key;

                      return (
                        <button
                          key={item.key}
                          className={isActive ? styles.metricTileActive : styles.metricTile}
                          onClick={() => handleMetricSelect(item.key)}
                          type="button"
                        >
                          <div className={styles.metricTileIcon}>
                            <Icon size={20} />
                          </div>
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}

              {step === "subtype" && metric ? (
                <>
                  <div className={styles.stepLabel}>
                    Step 2 — {metric === "convs" ? "Conversation Type" : "Lead Source"}
                  </div>
                  <div className={styles.subtypeList}>
                    {getSubtypeOptions(metric).map((option) => (
                      <button
                        key={option}
                        className={styles.subtypeButton}
                        onClick={() => handleSubtypeSelect(option)}
                        type="button"
                      >
                        <div className={styles.subtypeDot} />
                        {option}
                      </button>
                    ))}
                  </div>
                  <div className={styles.backRow}>
                    <button
                      className={styles.backButton}
                      onClick={() => { setStep("metric"); setMetric(null); }}
                      type="button"
                    >
                      Back
                    </button>
                  </div>
                </>
              ) : null}

              {step === "input" && metric ? (
                <>
                  <div className={styles.stepLabel}>
                    {isCountOnly(metric) ? "Step 2 — How Many?" : needsSubtype(metric) ? "Step 3 — Contact Info" : "Step 2 — Contact Info"}
                  </div>

                  {subtype ? (
                    <div className={styles.chipRow} style={{ marginBottom: 14 }}>
                      <span className={styles.chip}>{subtype}</span>
                    </div>
                  ) : null}

                  {isCountOnly(metric) ? (
                    <div className={styles.stepper}>
                      <button
                        className={styles.stepperButton}
                        onClick={() => setCount((c) => Math.max(1, c - 1))}
                        type="button"
                      >
                        <Minus size={18} />
                      </button>
                      <div className={styles.stepperValue}>{count}</div>
                      <button
                        className={styles.stepperButton}
                        onClick={() => setCount((c) => Math.min(500, c + 1))}
                        type="button"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.inputGroup}>
                      <label className={styles.inputLabel} htmlFor="logger_contact_name">
                        Contact Name
                      </label>
                      <input
                        autoFocus
                        className={styles.input}
                        id="logger_contact_name"
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Angela Morris"
                        value={contactName}
                      />
                    </div>
                  )}

                  <button
                    className={styles.submitButton}
                    disabled={isSubmitting || !canLog}
                    onClick={handleLog}
                    type="button"
                  >
                    <Save size={16} />
                    {isSubmitting ? "Saving..." : "Log Activity"}
                  </button>

                  <div className={styles.backRow}>
                    <button
                      className={styles.backButton}
                      onClick={() => {
                        if (needsSubtype(metric)) {
                          setStep("subtype");
                          setSubtype("");
                        } else {
                          setStep("metric");
                          setMetric(null);
                        }
                      }}
                      type="button"
                    >
                      Back
                    </button>
                  </div>
                </>
              ) : null}

              {step === "success" && result?.success ? (
                <div className={styles.successBody}>
                  <div className={styles.successIcon}>
                    <CheckCircle2 size={28} />
                  </div>
                  <div className={styles.successTitle}>Activity Logged!</div>
                  <div className={styles.chipRow}>
                    <span className={styles.chip}>
                      {metricCatalog.find((m) => m.key === result.metric)?.label}
                    </span>
                    {result.activityType ? (
                      <span className={styles.chip}>{result.activityType}</span>
                    ) : null}
                    {(result.count ?? 0) > 1 ? (
                      <span className={styles.chip}>x{result.count}</span>
                    ) : null}
                    {result.contactName ? (
                      <span className={styles.chip}>{result.contactName}</span>
                    ) : null}
                  </div>

                  {result.contactName && !result.contactExists && !contactSaved ? (
                    <div className={styles.contactPrompt}>
                      <div className={styles.contactPromptTitle}>
                        <UserPlus size={14} />
                        Save to Contacts?
                      </div>
                      <div className={styles.contactPromptDesc}>
                        &ldquo;{result.contactName}&rdquo; isn&apos;t in your contacts yet.
                      </div>
                      <button
                        className={styles.contactSaveButton}
                        disabled={isSavingContact}
                        onClick={handleSaveContact}
                        type="button"
                      >
                        <UserPlus size={14} />
                        {isSavingContact ? "Saving..." : "Save to Contacts"}
                      </button>
                    </div>
                  ) : null}

                  {contactSaved ? (
                    <div className={styles.contactSaved}>
                      <CheckCircle2 size={14} />
                      Contact saved!
                    </div>
                  ) : null}

                  {result.justEarned && result.streak ? (
                    <div className={styles.streakBanner}>
                      <div className={styles.streakEmoji}>🔥</div>
                      <div className={styles.streakTitle}>
                        {result.streak.current === 1
                          ? "Streak started! 100 pts hit today!"
                          : `${result.streak.current}-day streak! 100 pts again!`}
                      </div>
                      <div className={styles.streakSub}>
                        {result.streak.current >= result.streak.longest && result.streak.current > 1
                          ? "New record!"
                          : `Longest: ${result.streak.longest} days`}
                      </div>
                    </div>
                  ) : null}

                  <button className={styles.doneButton} onClick={handleClose} type="button">
                    Done
                  </button>
                </div>
              ) : null}

              {step === "success" && result && !result.success ? (
                <div className={styles.successBody}>
                  <div className={styles.successTitle} style={{ color: "#b91c1c" }}>
                    {result.error ?? "Something went wrong."}
                  </div>
                  <button className={styles.doneButton} onClick={reset} type="button">
                    Try Again
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
