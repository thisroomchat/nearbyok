import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getMe, postLogout } from "@/lib/nbk";

const AuthCtx = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try { setUser(await getMe()); } catch { setUser(null); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    // Returning from OAuth: AuthCallback exchanges session_id first, skip /me check.
    if (window.location.hash?.includes("session_id=")) { setLoading(false); return; }
    refresh();
  }, [refresh]);

  const login = (returnTo) => {
    sessionStorage.setItem("nbk_return_to", returnTo || window.location.pathname + window.location.search);
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + "/account";
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  const logout = async () => { await postLogout(); setUser(null); };

  return <AuthCtx.Provider value={{ user, loading, login, logout, setUser, refresh }}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);
