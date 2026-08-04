"use client";

export function LogoutButton() {
  return <button className="text-xs font-medium underline" onClick={async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.assign("/login");
  }}>Sign out</button>;
}
