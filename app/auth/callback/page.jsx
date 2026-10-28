"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { checkCafeStaffMembership } from "@/lib/cafe-auth";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    async function handleAuth() {
      if (!supabase) {
        setError("Supabase client is not configured.");
        return;
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (!session) {
          const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, newSession) => {
              if (newSession && !ignore) {
                subscription?.unsubscribe();
                await routeUser(newSession);
              }
            }
          );

          setTimeout(() => {
            if (!ignore && !session) {
              subscription?.unsubscribe();
              router.replace("/login");
            }
          }, 3500);
          return;
        }

        if (!ignore) {
          await routeUser(session);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Auth callback error:", err);
          setError(err.message || "Failed to complete authentication.");
        }
      }
    }

    async function routeUser(currentSession) {
      const next = searchParams.get("next") || "/dashboard";

      if (next.startsWith("/cafe")) {
        const { isStaff } = await checkCafeStaffMembership();
        if (isStaff) {
          router.replace("/cafe");
        } else {
          router.replace("/cafe/access-pending");
        }
        return;
      }

      router.replace(next);
    }

    handleAuth();

    return () => {
      ignore = true;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", background: "var(--bg, #08110d)", color: "var(--text, #f3f6f2)" }}>
        <div style={{ maxWidth: 420 }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(224, 140, 130, 0.12)", color: "var(--red, #e08c82)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <AlertTriangle size={24} />
          </div>
          <h2 style={{ fontSize: "1.25rem", marginBottom: 8 }}>Authentication Error</h2>
          <p style={{ color: "var(--muted, #9ba99f)", fontSize: 12, marginBottom: 20 }}>{error}</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <Link href="/login" className="button button-primary">Back to Sign In</Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "var(--bg, #08110d)", color: "var(--text, #f3f6f2)", gap: 16 }}>
      <div style={{ width: 36, height: 36, border: "3px solid rgba(145, 212, 168, 0.15)", borderTopColor: "var(--mint, #91d4a8)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <p style={{ fontSize: 13, color: "var(--muted, #9ba99f)", fontWeight: 500 }}>
        Completing Google sign in...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg, #08110d)" }}>
        <div style={{ width: 36, height: 36, border: "3px solid rgba(145, 212, 168, 0.15)", borderTopColor: "var(--mint, #91d4a8)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </main>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
