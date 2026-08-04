"use client";

import { FormEvent, useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.get("email"), password: form.get("password") })
    });
    const result = await response.json() as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Authentication failed.");
      setSubmitting(false);
      return;
    }
    window.location.assign("/");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-md border border-slate-300 bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">My Finance</p>
        <h1 className="mt-2 text-2xl font-semibold">{isRegister ? "Create account" : "Sign in"}</h1>
        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <label className="grid gap-1 text-sm font-medium">Email
            <input className="border border-slate-300 px-3 py-2" name="email" type="email" autoComplete="email" required />
          </label>
          <label className="grid gap-1 text-sm font-medium">Password
            <input className="border border-slate-300 px-3 py-2" name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister ? 12 : undefined} required />
          </label>
          {isRegister ? <p className="text-xs text-slate-500">Use at least 12 characters.</p> : null}
          {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
          <button className="bg-slate-950 px-4 py-2 font-medium text-white disabled:opacity-60" disabled={submitting} type="submit">
            {submitting ? "Please wait…" : isRegister ? "Register" : "Sign in"}
          </button>
        </form>
        <p className="mt-5 text-sm text-slate-600">
          {isRegister ? "Already registered?" : "Need an account?"}{" "}
          <a className="font-medium underline" href={isRegister ? "/login" : "/register"}>{isRegister ? "Sign in" : "Register"}</a>
        </p>
      </section>
    </main>
  );
}
