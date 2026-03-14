import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Activity Tracker",
  description: "Track workouts, habits, and daily momentum in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
