import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, Building2, Star, PlusCircle, BadgeCheck, Clock, XCircle, LogIn } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { BusinessCard } from "@/components/BusinessCard";
import { useAuth } from "@/context/AuthContext";
import { getFavorites, getMyListings, getMyReviews } from "@/lib/nbk";

const TABS = [["saved", "Saved Places", Bookmark], ["listings", "My Listings", Building2], ["reviews", "My Reviews", Star]];

const StatusPill = ({ status }) => {
  const map = { approved: ["bg-green-50 text-green-700", BadgeCheck, "Verified & Live"], pending: ["bg-amber-50 text-amber-700", Clock, "Live · Pending verification"], rejected: ["bg-red-50 text-red-700", XCircle, "Rejected"] };
  const [cls, Icon, label] = map[status] || map.pending;
  return <span data-testid="listing-status-pill" className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded ${cls}`}><Icon className="w-3.5 h-3.5" /> {label}</span>;
};

export default function Account() {
  const { user, loading, login } = useAuth();
  const [tab, setTab] = useState(new URLSearchParams(window.location.search).get("tab") || "saved");
  const [data, setData] = useState({ saved: null, listings: null, reviews: null });

  useEffect(() => {
    if (!user) return;
    const loader = { saved: getFavorites, listings: getMyListings, reviews: getMyReviews }[tab];
    loader().then((r) => setData((d) => ({ ...d, [tab]: r.items }))).catch(() => setData((d) => ({ ...d, [tab]: [] })));
  }, [user, tab]);

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
                    {tab === "listings" && <div className="flex items-center gap-2 px-1"><StatusPill status={b.status} /><span className="text-xs text-slate-400">{b.leads_call} call clicks</span></div>}
                    <BusinessCard b={b} state={b.state} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
