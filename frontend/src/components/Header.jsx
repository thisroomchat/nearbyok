import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, MapPin, Menu, PlusCircle, X, Bookmark, Building2, LogOut, LogIn, Star } from "lucide-react";
import { doSearch } from "@/lib/nbk";
import { useAuth } from "@/context/AuthContext";

const UserMenu = () => {
  const { user, login, logout } = useAuth();
  const [open, setOpen] = useState(false);
  if (!user) return (
    <button data-testid="header-login-button" onClick={() => login()} className="flex items-center gap-1.5 text-sm font-semibold bg-orange-600 hover:bg-orange-700 px-3.5 py-2 rounded-lg transition-colors">
      <LogIn className="w-4 h-4" /> <span className="hidden sm:inline">Login</span>
    </button>
  );
  return (
    <div className="relative">
      <button data-testid="header-user-menu-button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-full ring-2 ring-transparent hover:ring-orange-500 transition-shadow">
        {user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" className="w-9 h-9 rounded-full bg-slate-700" /> : <span className="w-9 h-9 rounded-full bg-orange-600 flex items-center justify-center font-bold">{user.name[0]}</span>}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-xl border border-slate-200 py-2 z-50" data-testid="header-user-dropdown" onMouseLeave={() => setOpen(false)}>
          <p className="px-4 py-2 text-xs text-slate-400 truncate">{user.email}</p>
          {[["/account?tab=saved", Bookmark, "Saved Places", "menu-saved-link"], ["/account?tab=listings", Building2, "My Listings", "menu-listings-link"], ["/account?tab=reviews", Star, "My Reviews", "menu-reviews-link"]].map(([to, Icon, label, tid]) => (
            <Link key={to} to={to} data-testid={tid} onClick={() => setOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50"><Icon className="w-4 h-4 text-orange-500" /> {label}</Link>
          ))}
          <button data-testid="menu-logout-button" onClick={() => { logout(); setOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-slate-50 text-red-600 border-t border-slate-100 mt-1"><LogOut className="w-4 h-4" /> Logout</button>
        </div>
      )}
    </div>
  );
};

export const Header = ({ compact = false }) => {
  const [what, setWhat] = useState("");
  const [where, setWhere] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    const res = await doSearch(what, where);
    navigate(`/${res.category}/${res.state}/${res.city}`);
  };

  return (
    <header className="sticky top-0 z-50 bg-slate-900 text-white border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-4 h-16">
          <a href="/" data-testid="brand-logo" className="flex items-center gap-1.5 shrink-0 group">
            <MapPin className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
            <span className="font-extrabold text-lg tracking-tight">
              nearby<span className="text-orange-500">ok</span>
            </span>
          </a>

          {!compact && (
            <form onSubmit={submit} className="hidden md:flex flex-1 max-w-2xl items-stretch bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="flex items-center flex-1 px-3 border-r border-slate-200">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  data-testid="global-search-input-what"
                  value={what}
                  onChange={(e) => setWhat(e.target.value)}
                  placeholder="Plumber, Coffee Shop, Dentist…"
                  className="w-full px-2 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>
              <div className="flex items-center flex-1 px-3">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  data-testid="global-search-input-where"
                  value={where}
                  onChange={(e) => setWhere(e.target.value)}
                  placeholder="City, State or Zip"
                  className="w-full px-2 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none"
                />
              </div>
              <button
                data-testid="global-search-submit-button"
                type="submit"
                className="bg-orange-600 hover:bg-orange-700 px-5 flex items-center gap-1.5 font-semibold text-sm transition-colors"
              >
                <Search className="w-4 h-4" /> <span className="hidden lg:inline">Search</span>
              </button>
            </form>
          )}

          <div className="ml-auto flex items-center gap-3">
            <Link
              to="/list-your-business"
              data-testid="free-listing-cta"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-lg transition-colors"
            >
              <PlusCircle className="w-4 h-4" /> Free Listing
            </Link>
            <UserMenu />
            <button
              data-testid="mobile-menu-toggle"
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {!compact && mobileOpen && (
          <form onSubmit={submit} className="md:hidden pb-4 space-y-2">
            <div className="flex items-center bg-white rounded-lg px-3">
              <Search className="w-4 h-4 text-slate-400" />
              <input value={what} onChange={(e) => setWhat(e.target.value)} placeholder="What are you looking for?" className="w-full px-2 py-2.5 text-sm text-slate-900 outline-none" />
            </div>
            <div className="flex items-center bg-white rounded-lg px-3">
              <MapPin className="w-4 h-4 text-slate-400" />
              <input value={where} onChange={(e) => setWhere(e.target.value)} placeholder="City, State or Zip" className="w-full px-2 py-2.5 text-sm text-slate-900 outline-none" />
            </div>
            <button type="submit" className="w-full bg-orange-600 py-2.5 rounded-lg font-semibold text-sm">Search</button>
          </form>
        )}
      </div>
    </header>
  );
};
