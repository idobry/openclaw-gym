import VerifyClient from "./VerifyClient";

// Never statically prerender - always render on request
export const dynamic = "force-dynamic";

export default function VerifyPage() {
  return <VerifyClient />;
}
