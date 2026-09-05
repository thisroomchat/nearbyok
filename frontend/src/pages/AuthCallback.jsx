import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { postSession } from "@/lib/nbk";
import { useAuth } from "@/context/AuthContext";

export default function AuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;
    const sid = new URLSearchParams(location.hash.replace(/^#/, "")).get("session_id");
    (async () => {
      try {
        const u = await postSession(sid);
        setUser(u);
        const to = sessionStorage.getItem("nbk_return_to") || "/account";
        sessionStorage.removeItem("nbk_return_to");
        navigate(to, { replace: true });
      } catch {
        navigate("/", { replace: true });
      }
    })();
  }, [location.hash, navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 gap-2" data-testid="auth-callback-loading">
      <Loader2 className="w-5 h-5 animate-spin" /> Signing you in…
    </div>
  );
}
