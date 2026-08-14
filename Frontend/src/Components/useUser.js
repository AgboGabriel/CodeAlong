// useUser.js — shared hook for the logged-in user
// Reads from sessionStorage immediately so the Header never flashes the
// default user while /auth/me is in-flight.

import { useState, useEffect } from "react";

const CACHE_KEY = "auth_user_cache";
const USER_UPDATED_EVENT = "auth-user-updated";

function readCache() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { user, ts } = JSON.parse(raw);
    // Cache is valid for 5 minutes
    if (Date.now() - ts < 5 * 60 * 1000) return user;
    sessionStorage.removeItem(CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

function notifyUserUpdated(user) {
  window.dispatchEvent(new CustomEvent(USER_UPDATED_EVENT, { detail: user }));
}

function writeCache(user) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ user, ts: Date.now() }));
  } catch {
    // sessionStorage unavailable — just skip caching
  }
}

export function updateCachedUser(userSnapshot) {
  try {
    const current = readCache();
    const nextUser = {
      ...(current || {}),
      ...(userSnapshot || {}),
    };

    writeCache(nextUser);
    notifyUserUpdated(nextUser);
  } catch {
    // sessionStorage unavailable — just skip caching
  }
}

// Call this from any page that updates the user (e.g. profile edit) to update
// all mounted consumers immediately.
export function clearUserCache() {
  sessionStorage.removeItem(CACHE_KEY);
  notifyUserUpdated(null);
}

export function useUser() {
  // Start with whatever is already cached — zero flicker on navigation
  const [user, setUser] = useState(() => readCache());
  const [loading, setLoading] = useState(!readCache());

  useEffect(() => {
    const handleUserUpdated = (event) => {
      setUser(event.detail || null);
      setLoading(false);
    };

    window.addEventListener(USER_UPDATED_EVENT, handleUserUpdated);

    // If we already have a valid cached user, no need to fetch
    if (readCache()) {
      setLoading(false);
      return () => {
        window.removeEventListener(USER_UPDATED_EVENT, handleUserUpdated);
      };
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/auth/me", { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        if (data.user) {
          writeCache(data.user);
          setUser(data.user);
        }
      } catch (err) {
        console.error("useUser fetch error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      window.removeEventListener(USER_UPDATED_EVENT, handleUserUpdated);
    };
  }, []);

  return { user, loading };
}
