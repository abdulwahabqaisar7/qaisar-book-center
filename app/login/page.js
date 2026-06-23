"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Run the setup endpoint on load just in case database is not initialized yet.
  // This makes testing the app for the first time extremely seamless.
  useEffect(() => {
    setMounted(true);
    async function triggerSetup() {
      try {
        await fetch("/api/auth/setup", { method: "POST" });
      } catch (err) {
        console.error("Setup error:", err);
      }
    }
    triggerSetup();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        if (data.user.role === "admin") {
          router.push("/");
        } else {
          router.push("/store");
        }
      } else {
        setError(data.error || "Invalid username or password.");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>📚</div>
          <h1 className={styles.title}>Qaisar Book Center</h1>
          <p className={styles.subtitle}>Stationery Management & Billing System</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.errorAlert}>{error}</div>}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Username</label>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              className={styles.input}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className={styles.input}
              required
            />
          </div>

          <button type="submit" disabled={loading || !mounted} className={styles.submitBtn}>
            {!mounted ? "Loading App..." : loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className={styles.infoFooter}>
          <p>Demo Admin: admin / admin101</p>
          <p>Demo Customer: customer / customer123</p>
        </div>
      </div>
    </div>
  );
}
