import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenClaw Gym - AI-Native Workout Programming API",
  description:
    "The first gym programming API built for AI agents. Authenticate, analyze, and optimize workout programs through a RESTful API.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
