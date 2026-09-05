import { useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { postReview } from "@/lib/nbk";

const Stars = ({ value, onChange, size = "w-4 h-4" }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)} data-testid={onChange ? `review-star-${n}` : undefined}
        className={onChange ? "hover:scale-110 transition-transform" : "cursor-default"}>
        <Star className={`${size} ${n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
      </button>
    ))}
  </div>
);

const ReviewItem = ({ r }) => (
  <div className="py-4 flex gap-3" data-testid="review-item">
    {r.author_photo ? <img src={r.author_photo} alt="" className="w-9 h-9 rounded-full bg-slate-100 shrink-0" referrerPolicy="no-referrer" />
      : <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold shrink-0">{(r.author || "?")[0]}</div>}
    <div className="min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-semibold text-sm text-slate-900">{r.author}</span>
        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${r.source === "google" ? "bg-slate-100 text-slate-600" : "bg-orange-50 text-orange-700"}`}>{r.source === "google" ? "Google" : "nearbyok"}</span>
        <span className="text-xs text-slate-400">{r.time || (r.created_at ? new Date(r.created_at).toLocaleDateString() : "")}</span>
      </div>
      <Stars value={r.rating || 0} size="w-3.5 h-3.5" />
      <p className="text-sm text-slate-600 mt-1 leading-relaxed whitespace-pre-line">{r.text}</p>
    </div>
  </div>
);

export const Reviews = ({ businessId, google = [], users = [] }) => {
  const { user, login } = useAuth();
  const [list, setList] = useState(users);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const mine = user && list.find((r) => r.user_id === user.user_id);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await postReview(businessId, { rating, text });
      setList(r.users);
      setText("");
      toast.success("Thanks! Your review is live.");
    } catch (err) {
      toast.error(err?.response?.data?.detail?.[0]?.msg || "Could not post review");
    } finally { setBusy(false); }
  };

  const avg = list.length ? (list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(1) : null;

  return (
    <div>
      <div className="grid sm:grid-cols-[1fr_auto] gap-4 items-start">
        <p className="text-sm text-slate-500">{google.length} Google reviews · {list.length} nearbyok reviews{avg ? ` (avg ${avg}★)` : ""}</p>
      </div>

      <form onSubmit={submit} className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3" data-testid="review-form">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <p className="font-semibold text-sm text-slate-800">{mine ? "Update your review" : "Write a review"}</p>
          <Stars value={rating} onChange={user ? setRating : undefined} size="w-6 h-6" />
        </div>
        {user ? (
          <>
            <textarea data-testid="review-text-input" value={text} onChange={(e) => setText(e.target.value)} required minLength={3} rows={3}
              placeholder="Share your experience — service, pricing, staff, wait time…"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500 bg-white" />
            <button type="submit" disabled={busy} data-testid="review-submit-button"
              className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors disabled:opacity-60">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Post review
            </button>
          </>
        ) : (
          <button type="button" onClick={() => login()} data-testid="review-login-button"
            className="bg-white border border-slate-300 hover:border-slate-900 font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors">
            Login with Google to write a review
          </button>
        )}
      </form>

      <div className="divide-y divide-slate-100 mt-2" data-testid="reviews-list">
        {list.map((r) => <ReviewItem key={r.id} r={r} />)}
        {google.map((r, i) => <ReviewItem key={`g${i}`} r={r} />)}
        {!list.length && !google.length && <p className="py-6 text-sm text-slate-400 text-center">No reviews yet. Be the first to review!</p>}
      </div>
    </div>
  );
};
