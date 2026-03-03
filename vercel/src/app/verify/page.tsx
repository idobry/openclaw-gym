"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

type AuthType = "loading" | "confirmed" | "recovery" | "error";

export default function VerifyPage() {
  const [authType, setAuthType] = useState<AuthType>("loading");
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  useEffect(() => {
    // Supabase redirects with hash fragment: #access_token=...&type=signup|recovery
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const type = params.get("type");
    const errorDesc = params.get("error_description");

    if (errorDesc) {
      setError(errorDesc);
      setAuthType("error");
      return;
    }

    if (type === "recovery") {
      setAuthType("recovery");
      return;
    }

    if (type === "signup" || type === "email_change" || type === "magiclink") {
      setAuthType("confirmed");
      return;
    }

    // Also check query params (PKCE flow)
    const urlParams = new URLSearchParams(window.location.search);
    const tokenHash = urlParams.get("token_hash");
    const urlType = urlParams.get("type");

    if (tokenHash && urlType) {
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type: urlType as any })
        .then(({ error }) => {
          if (error) {
            setError(error.message);
            setAuthType("error");
          } else if (urlType === "recovery") {
            setAuthType("recovery");
          } else {
            setAuthType("confirmed");
          }
        });
      return;
    }

    // No recognizable params
    setError("Invalid or expired link. Please request a new one.");
    setAuthType("error");
  }, []);

  const handleResetPassword = async () => {
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setResetting(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setResetting(false);
    } else {
      setResetDone(true);
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-2xl font-bold">
            OpenClaw<span className="text-[#6C5CE7]">.gym</span>
          </span>
        </div>

        {/* Loading */}
        {authType === "loading" && (
          <div className="bg-[#1A1A24] rounded-2xl p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-[#6C5CE7] border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-[#7B7B94]">Verifying...</p>
          </div>
        )}

        {/* Email Confirmed */}
        {authType === "confirmed" && (
          <div className="bg-[#1A1A24] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-[rgba(52,211,153,0.15)] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Email Confirmed</h1>
            <p className="text-[#7B7B94] mb-6">
              Your account is ready. Open the app to get started.
            </p>
            <a
              href="gym://"
              className="inline-block bg-[#6C5CE7] hover:bg-[#5A4BD6] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Open App
            </a>
          </div>
        )}

        {/* Password Reset Form */}
        {authType === "recovery" && !resetDone && (
          <div className="bg-[#1A1A24] rounded-2xl p-8">
            <h1 className="text-2xl font-bold mb-2 text-center">Reset Password</h1>
            <p className="text-[#7B7B94] mb-6 text-center">
              Enter your new password below.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#7B7B94] mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="At least 6 characters"
                  className="w-full bg-[#0D0D12] border border-[#242430] rounded-xl px-4 py-3 text-[#F5F5FA] placeholder-[#4A4A5E] focus:outline-none focus:border-[#6C5CE7] transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#7B7B94] mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(null); }}
                  placeholder="Repeat your password"
                  className="w-full bg-[#0D0D12] border border-[#242430] rounded-xl px-4 py-3 text-[#F5F5FA] placeholder-[#4A4A5E] focus:outline-none focus:border-[#6C5CE7] transition-colors"
                />
              </div>

              {error && (
                <div className="bg-[rgba(248,113,113,0.1)] rounded-xl px-4 py-3">
                  <p className="text-[#F87171] text-sm">{error}</p>
                </div>
              )}

              <button
                onClick={handleResetPassword}
                disabled={resetting || !password || !confirmPassword}
                className="w-full bg-[#6C5CE7] hover:bg-[#5A4BD6] disabled:bg-[#242430] disabled:text-[#4A4A5E] text-white font-semibold py-3 rounded-xl transition-colors"
              >
                {resetting ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        )}

        {/* Password Reset Success */}
        {authType === "recovery" && resetDone && (
          <div className="bg-[#1A1A24] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-[rgba(52,211,153,0.15)] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Password Updated</h1>
            <p className="text-[#7B7B94] mb-6">
              Your password has been changed. Open the app to sign in.
            </p>
            <a
              href="gym://"
              className="inline-block bg-[#6C5CE7] hover:bg-[#5A4BD6] text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Open App
            </a>
          </div>
        )}

        {/* Error */}
        {authType === "error" && (
          <div className="bg-[#1A1A24] rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-[rgba(248,113,113,0.1)] rounded-full flex items-center justify-center mx-auto mb-4">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-2">Something Went Wrong</h1>
            <p className="text-[#7B7B94] mb-6">
              {error || "This link may be expired or invalid."}
            </p>
            <a
              href="gym://"
              className="inline-block bg-[#242430] hover:bg-[#2A2A3C] text-[#F5F5FA] font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              Open App
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
