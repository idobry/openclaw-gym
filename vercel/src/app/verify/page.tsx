"use client";

import dynamic from "next/dynamic";

// Prevent SSG - this page must only run in the browser
const VerifyContent = dynamic(() => import("./VerifyContent"), { ssr: false });

export default function VerifyPage() {
  return <VerifyContent />;
}
