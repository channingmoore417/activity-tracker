"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  LayoutDashboard,
  TrendingUp,
  CalendarRange,
  Users,
  Settings,
} from "lucide-react";
import styles from "./mobile-nav.module.css";

const navItems = [
  { href: "/dashboard", label: "Dashboard", view: "dashboard", icon: LayoutDashboard },
  { href: "/activity", label: "Activity Log", view: "activity", icon: TrendingUp },
  { href: "/progress", label: "Progress", view: "progress", icon: CalendarRange },
  { href: "/contacts", label: "Contacts", view: "contacts", icon: Users },
  { href: "/settings", label: "Settings", view: "settings", icon: Settings },
];

export function MobileNav({ currentView }: { currentView: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className={styles.hamburger}
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={22} />
      </button>

      {open && (
        <>
          <div className={styles.backdrop} onClick={() => setOpen(false)} />
          <nav className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <span className={styles.drawerTitle}>Menu</span>
              <button
                className={styles.closeBtn}
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>
            <ul className={styles.navList}>
              {navItems.map(({ href, label, view, icon: Icon }) => (
                <li key={href}>
                  <Link
                    className={
                      currentView === view
                        ? styles.navLinkActive
                        : styles.navLink
                    }
                    href={href}
                    onClick={() => setOpen(false)}
                  >
                    <Icon size={18} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
