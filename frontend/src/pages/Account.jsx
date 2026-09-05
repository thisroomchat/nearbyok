import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Building2, Star, PlusCircle, BadgeCheck, Clock, XCircle, LogIn, ShieldCheck, Pencil } from "lucide-react";
import { OwnerEditor } from "@/components/OwnerEditor";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { BusinessCard } from "@/components/BusinessCard";
import { useAuth } from "@/context/AuthContext";
import { getFavorites, getMyListings, getMyReviews, getMyClaims } from "@/lib/nbk";

const TABS = [["saved", "Saved Places", Bookmark], ["listings", "My Listings", Building2], ["claims", "My Claims", ShieldCheck], ["reviews", "My Reviews", Star]];
const CLAIM_CLS = { pending: "bg-amber-50 text-amber-700", approved: "bg-green-50 text-green-700", rejected: "bg-red-50 text-red-700", revoked: "bg-slate-100 text-slate-600" };

const StatusPill = ({ status }) => {
  const map = { approved: ["bg-green-50 text-green-700", BadgeCheck, "Verified & Live"], pending: ["bg-amber-50 text-amber-700", Clock, "Live · Pending verification"], rejected: ["bg-red-50 text-red-700", XCircle, "Rejected"] };
  const [cls, Icon, label] = map[status] || map.pending;
  return <span data-testid="listing-status-pill" className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${cls}`}><Icon className="w-3.5 h-3.5" /> {label}</span>;
};

export default function Account() {
  const { user, loading, login } = useAuth();
  const [tab, setTab] = useState(new URLSearchParams(window.location.search).get("tab") || "saved");
  const [data, setData] = useState({ saved: null, listings: null, claims: null, reviews: null });
  const [editing, setEditing] = useState(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!user) return;
    const loader = { saved: getFavorites, listings: getMyListings, claims: getMyClaims, reviews: getMyReviews }[tab];
    loader().then((r) => setData((d) => ({ ...d, [tab]: r.items }))).catch(() => setData((d) => ({ ...d, [tab]: [] })));
  }, [user, tab, tick]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Seo title="My Account — nearbyok.com" description="Your saved places, listings and reviews on nearbyok.com" canonical="https://nearbyok.com/account" />
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 w-full py-8">
        {loading ? <p className="text-slate-400 py-20 text-center">Loading…</p> : !user ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-md mx-auto" data-testid="account-login-prompt">
            <LogIn className="w-10 h-10 text-orange-500 mx-auto" />
            <h1 className="text-2xl font-extrabold text-slate-900 mt-4">Sign in to nearbyok</h1>
            <p className="text-sm text-slate-500 mt-2">Save your favourite places, write reviews and manage your business listings.</p>
            <button data-testid="account-google-login-button" onClick={() => login("/account")} className="mt-6 bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-lg transition-colors w-full">Continue with Google</button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-8">
              {user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" className="w-14 h-14 rounded-full bg-slate-200" /> : <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-xl">{user.name[0]}</div>}
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900" data-testid="account-user-name">{user.name}</h1>
                <p className="text-sm text-slate-500">{user.email}</p>
              </div>
              <Link to="/list-your-business" data-testid="account-add-listing-link" className="ml-auto hidden sm:flex items-center gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors"><PlusCircle className="w-4 h-4" /> Add Business</Link>
            </div>

            <div className="flex gap-2 border-b border-slate-200 mb-6">
              {TABS.map(([k, label, Icon]) => (
                <button key={k} data-testid={`account-tab-${k}`} onClick={() => setTab(k)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === k ? "border-orange-600 text-orange-700" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
                  <Icon className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>

            {data[tab] === null ? <p className="text-slate-400 py-10 text-center">Loading…</p> : data[tab].length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-12 text-center text-slate-500 text-sm" data-testid="account-empty-state">
                {tab === "saved" && "No saved places yet. Tap the bookmark icon on any business to save it here."}
                {tab === "listings" && <>You haven't listed a business yet. <Link to="/list-your-business" className="text-orange-600 font-semibold">List it free →</Link></>}
                {tab === "reviews" && "You haven't written any reviews yet."}
                {tab === "claims" && "No claims yet. Open any business page and tap \"Claim this business\" to manage it."}
              </div>
            ) : tab === "claims" ? (
              <div className="space-y-3">
                {data.claims.map((c) => (
                  <div key={c.id} className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3" data-testid="my-claim-item">
                    <div className="flex-1 min-w-0">
                      <Link to={`/${c.business.category}/${c.business.state}/${c.business.city}/${c.business.slug}`} className="font-bold text-slate-900 hover:text-blue-600">{c.business_name}</Link>
                      <p className="text-xs text-slate-400">{c.business.area}, {c.business.city_name} · claimed as {c.role} · {new Date(c.created_at).toLocaleDateString()}</p>
                      {c.note && <p className="text-xs text-slate-500 mt-1">Admin note: {c.note}</p>}
                    </div>
                    <span data-testid="claim-status-pill" className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded capitalize ${CLAIM_CLS[c.status] || CLAIM_CLS.pending}`}>{c.status === "pending" ? "Under review" : c.status}</span>
                    {c.status === "approved" && <button data-testid="claim-manage-button" onClick={() => setEditing(c.business_id)} className="inline-flex items-center gap-1 bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-lg"><Pencil className="w-3.5 h-3.5" /> Manage</button>}
                  </div>
                ))}
              </div>
            ) : tab === "reviews" ? (
              <div className="space-y-3">
                {data.reviews.map((r) => (
                  <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4" data-testid="my-review-item">
                    <Link to={`/${r.business.category}/${r.business.state}/${r.business.city}/${r.business.slug}`} className="font-bold text-slate-900 hover:text-blue-600">{r.business.name}</Link>
                    <p className="text-xs text-slate-400">{r.business.area}, {r.business.city_name} · {new Date(r.created_at).toLocaleDateString()}</p>
                    <div className="flex items-center gap-0.5 mt-1">{[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-3.5 h-3.5 ${n <= r.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />)}</div>
                    <p className="text-sm text-slate-600 mt-1">{r.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {data[tab].map((b) => (
                  <div key={b.id} className="space-y-1">
                    {tab === "listings" && <div className="flex items-center gap-2 px-1 flex-wrap"><StatusPill status={b.status} />{b.claimed && <span className="text-xs font-semibold text-blue-700 inline-flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Claimed</span>}<span className="text-xs text-slate-400">{b.leads_call} call clicks</span>
                      <button data-testid="listing-manage-button" onClick={() => setEditing(b.id)} className="ml-auto inline-flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"><Pencil className="w-3.5 h-3.5" /> Manage</button></div>}
                    <BusinessCard b={b} state={b.state} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      {editing && <OwnerEditor businessId={editing} onClose={() => setEditing(null)} onSaved={() => setTick((t) => t + 1)} />}
      <Footer />
    </div>
  );
}
