import { useState } from "react";
import { Bookmark, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { toggleFavorite } from "@/lib/nbk";

export const SaveButton = ({ businessId, initial = false, label = false }) => {
  const { user, login } = useAuth();
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);

  const click = async () => {
    if (!user) { toast("Login with Google to save places"); login(); return; }
    setBusy(true);
    try {
      const r = await toggleFavorite(businessId);
      setSaved(r.saved);
      toast.success(r.saved ? "Saved to your places" : "Removed from saved");
    } finally { setBusy(false); }
  };

  return (
    <button data-testid="detail-save-btn" onClick={click} aria-pressed={saved} title={saved ? "Saved" : "Save this place"}
      className={`h-10 ${label ? "px-3 gap-2" : "w-10"} rounded-lg border flex items-center justify-center transition-colors text-sm font-semibold ${saved ? "bg-orange-50 border-orange-500 text-orange-700" : "border-slate-200 hover:border-slate-900 text-slate-600"}`}>
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className={`w-4 h-4 ${saved ? "fill-orange-500 text-orange-500" : ""}`} />}
      {label && (saved ? "Saved" : "Save")}
    </button>
  );
};
