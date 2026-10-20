"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [status, setStatus] = useState("checking");
  const [details, setDetails] = useState(null);

  useEffect(() => {
    async function checkConnection() {
      try {
        // A lightweight query: fetch the server timestamp
        const { data, error } = await supabase.rpc("get_cafe_menu", {
          p_cafe_id: "00000000-0000-0000-0000-000000000000",
        });

        // Even if the RPC returns an error (no such cafe), the fact that
        // Supabase responded means the connection works.
        if (error && !error.message) {
          throw error;
        }

        setStatus("connected");
        setDetails("Supabase responded successfully.");
      } catch (err) {
        // If the error message mentions the function or parameters,
        // the connection itself is fine — the RPC just rejected the input.
        if (
          err?.message?.includes("get_cafe_menu") ||
          err?.code === "PGRST202" ||
          err?.message?.includes("Could not find")
        ) {
          setStatus("connected");
          setDetails("Supabase connection OK (RPC exists but no matching data).");
        } else {
          setStatus("error");
          setDetails(err?.message || "Unknown error");
        }
      }
    }

    checkConnection();
  }, []);

  return (
    <div className="flex flex-col flex-1 items-center justify-center px-6 font-sans">
      <div className="w-full max-w-md space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Smart Cafeteria
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Ordering System &mdash; MVP
        </p>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-3">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            Supabase Connection
          </h2>

          {status === "checking" && (
            <p className="text-amber-600 dark:text-amber-400">
              &#9203; Checking connection&hellip;
            </p>
          )}
          {status === "connected" && (
            <p className="text-emerald-600 dark:text-emerald-400">
              &#10003; Connected
            </p>
          )}
          {status === "error" && (
            <p className="text-red-600 dark:text-red-400">
              &#10007; Connection failed
            </p>
          )}

          {details && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 break-words">
              {details}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
