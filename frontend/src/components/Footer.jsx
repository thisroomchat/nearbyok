import { MapPin, Facebook, Instagram, Twitter, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";

const FEATURED = ["Browse by Cities", "Browse by Areas", "Featured Categories", "All Categories",
  "New Categories", "Top Product Categories", "Featured Companies", "All Companies With Photos", "All Companies With Reviews"];

export const Footer = () => (
  <footer className="bg-slate-900 text-slate-300 mt-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h3 className="text-white font-bold text-lg mb-4">Featured Links</h3>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-400">
          <Link to="/nearby" data-testid="footer-nearby-link" className="hover:text-orange-400 transition-colors border-r border-slate-700 pr-5 font-semibold text-slate-300">Nearby searches</Link>
          <Link to="/list-your-business" className="hover:text-orange-400 transition-colors border-r border-slate-700 pr-5">List your business</Link>
          {FEATURED.map((f) => (
            <a key={f} href="#" className="hover:text-orange-400 transition-colors border-r border-slate-700 pr-5 last:border-0">{f}</a>
          ))}
        </div>
      </div>

      <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <Link to="/" className="flex items-center gap-1.5">
          <MapPin className="w-6 h-6 text-orange-500" strokeWidth={2.5} />
          <span className="font-extrabold text-lg text-white">nearby<span className="text-orange-500">ok</span></span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 mr-1">Follow us on</span>
          {[Facebook, Instagram, Twitter, Linkedin].map((Icon, i) => (
            <a key={i} href="#" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-orange-600 flex items-center justify-center transition-colors">
              <Icon className="w-4 h-4" />
            </a>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500 mt-8">
        © {new Date().getFullYear()} nearbyok.com — Find local businesses, services & stores near you across US cities.
        Business data may be provided by Google Maps.
      </p>
    </div>
  </footer>
);
