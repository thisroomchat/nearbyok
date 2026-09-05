import { Link } from "react-router-dom";
import { Star, MapPin, Clock, BadgeCheck, MessageCircle, Navigation } from "lucide-react";
import { ShowNumber } from "@/components/ShowNumber";
import { postLead } from "@/lib/nbk";

const ratingColor = (r) => (r >= 4.5 ? "bg-green-700" : r >= 4.0 ? "bg-green-600" : r >= 3.5 ? "bg-lime-600" : "bg-amber-600");

export const BusinessCard = ({ b, state, onHover }) => {
  const to = `/${b.category}/${state}/${b.city}/${b.slug}`;

  const whatsapp = async (e) => {
    e.preventDefault();
    await postLead({ business_id: b.id, type: "whatsapp" });
    const num = b.phone.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(`Hi, I found your listing on nearbyok.com. I'd like to inquire about your services.`);
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  };

  const directions = async (e) => {
    e.preventDefault();
    await postLead({ business_id: b.id, type: "directions" });
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`, "_blank");
  };

  return (
    <div
      onMouseEnter={() => onHover?.(b.id)}
      onMouseLeave={() => onHover?.(null)}
      className="border border-slate-200 hover:border-blue-500 rounded-xl p-4 sm:p-5 bg-white shadow-sm hover:shadow-md transition-[box-shadow,border-color] flex gap-4"
    >
      <Link to={to} className="shrink-0">
        <img src={b.images?.[0]} alt={b.name} loading="lazy" referrerPolicy="no-referrer"
          className="w-24 h-24 sm:w-28 sm:h-28 object-cover rounded-lg bg-slate-100" />
      </Link>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <Link to={to} data-testid="business-card-title-link" className="group">
            <h3 className="font-bold text-slate-900 text-base sm:text-lg leading-snug group-hover:text-blue-600 transition-colors flex items-center gap-1.5">
              {b.name}
              {b.verified && <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />}
            </h3>
          </Link>
          {b.sponsored && (
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 px-2 py-0.5 rounded shrink-0">Sponsored</span>
          )}
          {b.source === "owner" && !b.verified && (
            <span data-testid="card-unverified-badge" className="text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-600 px-2 py-0.5 rounded shrink-0">Unverified</span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm">
          <span className={`inline-flex items-center gap-1 ${ratingColor(b.rating)} text-white font-bold px-1.5 py-0.5 rounded text-xs`}>
            {b.rating} <Star className="w-3 h-3 fill-white" />
          </span>
          <span className="text-slate-500 text-xs">{b.reviews_count} Ratings</span>
          {b.distance != null && <span className="text-slate-400 text-xs">· {b.distance} mi away</span>}
        </div>

        <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1 truncate">
          <MapPin className="w-3.5 h-3.5 shrink-0" /> {b.area}, {b.city_name}
        </p>
        <p className={`text-xs mt-1 flex items-center gap-1 ${b.open_now ? "text-green-600" : "text-red-500"}`}>
          <Clock className="w-3.5 h-3.5 shrink-0" /> {b.hours_status}
        </p>

        <div className="grid grid-cols-3 gap-2 mt-3 max-w-md">
          <ShowNumber businessId={b.id} testId="business-card-show-number-button" />
          <button data-testid="business-card-whatsapp-button" onClick={whatsapp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm transition-colors">
            <MessageCircle className="w-4 h-4" /> <span className="hidden sm:inline">WhatsApp</span>
          </button>
          <button data-testid="business-card-directions-button" onClick={directions}
            className="border border-slate-300 hover:border-slate-900 text-slate-700 font-semibold px-3 py-2.5 rounded-lg flex items-center justify-center gap-1.5 text-sm transition-colors">
            <Navigation className="w-4 h-4" /> <span className="hidden sm:inline">Directions</span>
          </button>
        </div>
      </div>
    </div>
  );
};
