"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/browser";

export function AdminLoginForm() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorText("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorText(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/admin/pricing");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-bold text-[#0f1720]">
          E-mailadres
        </label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-2xl border border-[#d6d9df] px-4 py-4 outline-none transition focus:border-[#0b5a4e] focus:ring-4 focus:ring-[#0b5a4e]/10"
          required
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-[#0f1720]">
          Wachtwoord
        </label>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-2xl border border-[#d6d9df] px-4 py-4 outline-none transition focus:border-[#0b5a4e] focus:ring-4 focus:ring-[#0b5a4e]/10"
          required
        />
      </div>

      {errorText ? <p className="text-sm text-red-600">{errorText}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center rounded-full bg-[#f4c542] px-6 py-4 font-bold text-[#083b34] transition hover:scale-[1.01] disabled:opacity-70"
      >
        {loading ? "Bezig..." : "Inloggen"}
      </button>
    </form>
  );
}