import { useState } from "react";
import { TripMap } from "@/components/TripMap";
import { TripShareBar } from "@/components/TripShareBar";
import {
  MapPin, Clock, Wallet, CalendarDays, Route, Music2, Film, Camera, Video,
  Radio, Eye, Star, Bookmark, BookmarkCheck, Coffee, UtensilsCrossed, Bus, Car,
  Sparkles, Backpack, Lightbulb, ChevronDown,
} from "lucide-react";

const TYPE_ICON = {
  travel: Bus, breakfast: Coffee, lunch: UtensilsCrossed, dinner: UtensilsCrossed,
  snack: Coffee, stop: MapPin, explore: Sparkles, activity: Sparkles, rest: Clock, checkin: MapPin,
};
const MOMENT_ICON = { photo: Camera, video: Video, reel: Video, live: Radio, view: Eye };
const MOMENT_COLOR = {
  photo: "bg-blue-50 text-blue-700 border-blue-200",
  video: "bg-purple-50 text-purple-700 border-purple-200",
  reel: "bg-pink-50 text-pink-700 border-pink-200",
  live: "bg-red-50 text-red-700 border-red-200",
  view: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const Chip = ({ icon: Icon, children }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-xs font-semibold text-white print:bg-slate-100 print:text-slate-800">
    <Icon className="w-3.5 h-3.5" /> {children}
  </span>
);

const mapsUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

const Item = ({ it }) => {
  const Icon = TYPE_ICON[it.type] || MapPin;
  return (
    <div className="relative pl-10">
      <div className="absolute left-0 top-1 w-7 h-7 rounded-full bg-orange-100 border-2 border-orange-500 flex items-center justify-center">
        <Icon className="w-3.5 h-3.5 text-orange-600" />
      </div>
      <div className="pb-6">
        <div className="flex flex-wrap items-center gap-2">
          {it.time && <span className="text-xs font-bold text-orange-600">{it.time}</span>}
          <span className="text-[10px] uppercase tracking-wide font-semibold text-slate-400">{it.type}</span>
          {it.duration && <span className="text-[11px] text-slate-400">· {it.duration}</span>}
          {it.cost && <span className="ml-auto text-xs font-bold text-emerald-600">{it.cost}</span>}
        </div>
        <h4 className="text-[15px] font-bold text-slate-900 mt-0.5">{it.title}</h4>
        {it.location && (
          <a href={mapsUrl(it.location)} target="_blank" rel="noreferrer"
             className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline mt-0.5">
            <MapPin className="w-3 h-3" /> {it.location}
          </a>
        )}
        {it.description && <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{it.description}</p>}

        {it.place && it.place.name && (
          <div className="mt-2 flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            {it.place.rating && (
              <span className="inline-flex items-center gap-1 font-bold text-amber-600">
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {it.place.rating}
              </span>
            )}
            <span className="text-slate-600 truncate">{it.place.name}</span>
            {it.place.maps_url && (
              <a href={it.place.maps_url} target="_blank" rel="noreferrer" className="ml-auto text-blue-600 font-semibold shrink-0">View ↗</a>
            )}
          </div>
        )}

        {it.tips?.length > 0 && (
          <ul className="mt-2 space-y-1">
            {it.tips.map((t, i) => (
              <li key={i} className="flex gap-1.5 text-xs text-slate-500"><Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" /> {t}</li>
            ))}
          </ul>
        )}

        {it.songs?.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            {it.songs.map((s, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-2">
                <Music2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-indigo-900">{s.title}{s.artist ? ` — ${s.artist}` : ""}</p>
                  {s.why && <p className="text-[11px] text-indigo-700/80">{s.why}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {it.movies?.length > 0 && (
          <div className="mt-2 space-y-1.5">
            {it.movies.map((m, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg bg-fuchsia-50 border border-fuchsia-100 px-3 py-2">
                <Film className="w-4 h-4 text-fuchsia-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-fuchsia-900">{m.title}</p>
                  {m.why && <p className="text-[11px] text-fuchsia-700/80">{m.why}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {it.moments?.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            {it.moments.map((mo, i) => {
              const MIcon = MOMENT_ICON[mo.kind] || Camera;
              const cls = MOMENT_COLOR[mo.kind] || MOMENT_COLOR.photo;
              return (
                <div key={i} className={`flex items-start gap-2 rounded-lg border px-3 py-2 ${cls}`}>
                  <MIcon className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold">
                      <span className="uppercase tracking-wide text-[9px] mr-1.5 opacity-70">{mo.kind}</span>
                      {mo.title}{mo.at ? ` · ${mo.at}` : ""}
                    </p>
                    {mo.tip && <p className="text-[11px] opacity-80">{mo.tip}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const Faq = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left">
        <span className="text-sm font-semibold text-slate-800">{q}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <p className="px-4 pb-4 text-sm text-slate-600 leading-relaxed">{a}</p>}
    </div>
  );
};

export const TripResult = ({ plan, planId, onSave, saving, saved, shareUrl }) => {
  const [activeDay, setActiveDay] = useState(0);
  if (!plan) return null;
  const days = plan.days || [];
  const waypoints = plan.map?.waypoints || [];
  const route = plan.route;

  return (
    <div className="space-y-5 print:space-y-3" data-testid="trip-result">
      {/* hero */}
      <div className="rounded-2xl bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-6 text-white shadow-lg print:bg-none print:text-slate-900 print:border print:border-slate-300 print:shadow-none">
        <h2 className="text-2xl font-extrabold tracking-tight">{plan.title}</h2>
        {plan.summary && <p className="text-sm text-white/90 mt-1.5 max-w-3xl leading-relaxed print:text-slate-700">{plan.summary}</p>}
        <div className="flex flex-wrap gap-2 mt-4">
          {plan.distance_text && <Chip icon={Route}>{plan.distance_text}{route ? " by road" : ""}</Chip>}
          {plan.drive_time_text && <Chip icon={Car}>{plan.drive_time_text} {route?.mode === "transit" ? "transit" : "drive"}</Chip>}
          {plan.duration_text && <Chip icon={Clock}>{plan.duration_text}</Chip>}
          {plan.total_budget && <Chip icon={Wallet}>{plan.total_budget}</Chip>}
          {plan.best_time_to_visit && <Chip icon={CalendarDays}>{plan.best_time_to_visit}</Chip>}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4 print:hidden">
          {planId && onSave && (
            <button onClick={onSave} disabled={saving || saved} data-testid="save-trip-btn"
              className="inline-flex items-center gap-2 rounded-lg bg-white text-orange-600 font-bold text-sm px-4 py-2 hover:bg-orange-50 disabled:opacity-60">
              {saved ? <><BookmarkCheck className="w-4 h-4" /> Saved</> : <><Bookmark className="w-4 h-4" /> {saving ? "Saving…" : "Save this plan"}</>}
            </button>
          )}
          <TripShareBar shareUrl={shareUrl} title={plan.title} />
        </div>
        {shareUrl && <p className="hidden print:block text-xs text-slate-500 mt-3">Live plan: {shareUrl}</p>}
      </div>

      {/* map + route legs */}
      {waypoints.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4">
          <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Route className="w-4 h-4 text-orange-500" /> Route & Stops
            {route && <span data-testid="route-road-badge" className="ml-auto text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">Real road route · {route.distance_text} · {route.duration_text}</span>}
          </h3>
          <div className="print:hidden"><TripMap waypoints={waypoints} route={route} /></div>
          {route?.legs?.length > 1 && (
            <ol data-testid="route-legs" className="mt-3 grid sm:grid-cols-2 gap-1.5 text-xs text-slate-600">
              {route.legs.map((l, i) => (
                <li key={i} className="flex gap-2 bg-slate-50 rounded-lg px-3 py-2">
                  <span className="font-bold text-orange-600 shrink-0">{i + 1}.</span>
                  <span className="truncate">{l.from.split(",")[0]} → {l.to.split(",")[0]}</span>
                  <span className="ml-auto shrink-0 text-slate-500">{l.distance_text} · {l.duration_text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {/* day tabs */}
      {days.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 print:hidden" data-testid="day-tabs">
          {days.map((d, i) => (
            <button key={i} onClick={() => setActiveDay(i)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold border transition-colors ${i === activeDay ? "bg-orange-500 text-white border-orange-500" : "bg-white text-slate-600 border-slate-200 hover:border-orange-300"}`}>
              Day {d.day || i + 1}
            </button>
          ))}
        </div>
      )}

      {/* timeline — screen shows active day; print shows every day */}
      {days.map((d, i) => (
        <div key={i} className={`bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 print:break-inside-avoid ${i === activeDay ? "" : "hidden print:block"}`}>
          <h3 className="text-lg font-bold text-slate-900">Day {d.day || i + 1}: {d.title}</h3>
          {d.summary && <p className="text-sm text-slate-500 mt-1 mb-4">{d.summary}</p>}
          <div className="relative">
            <div className="absolute left-[13px] top-2 bottom-2 w-0.5 bg-orange-100" />
            {(d.items || []).map((it, j) => <Item key={j} it={it} />)}
          </div>
        </div>
      ))}

      {/* budget */}
      {plan.budget_breakdown?.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Wallet className="w-5 h-5 text-emerald-500" /> Budget Breakdown</h3>
          <div className="divide-y divide-slate-100">
            {plan.budget_breakdown.map((b, i) => (
              <div key={i} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{b.category}</p>
                  {b.note && <p className="text-xs text-slate-400">{b.note}</p>}
                </div>
                <span className="text-sm font-bold text-slate-900">{b.amount}</span>
              </div>
            ))}
          </div>
          {plan.total_budget && (
            <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-slate-200">
              <span className="text-sm font-bold text-slate-900">Total</span>
              <span className="text-base font-extrabold text-emerald-600">{plan.total_budget}</span>
            </div>
          )}
        </div>
      )}

      {/* packing + tips */}
      <div className="grid sm:grid-cols-2 gap-4">
        {plan.packing?.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Backpack className="w-4 h-4 text-blue-500" /> Packing List</h3>
            <div className="flex flex-wrap gap-2">
              {plan.packing.map((p, i) => <span key={i} className="text-xs bg-slate-100 text-slate-700 rounded-full px-3 py-1">{p}</span>)}
            </div>
          </div>
        )}
        {plan.tips?.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2"><Lightbulb className="w-4 h-4 text-amber-500" /> Travel Tips</h3>
            <ul className="space-y-1.5">
              {plan.tips.map((t, i) => <li key={i} className="text-xs text-slate-600 flex gap-1.5"><span className="text-amber-500">•</span> {t}</li>)}
            </ul>
          </div>
        )}
      </div>

      {/* faqs */}
      {plan.faqs?.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-slate-900">Frequently Asked Questions</h3>
          {plan.faqs.map((f, i) => <Faq key={i} q={f.q} a={f.a} />)}
        </div>
      )}
    </div>
  );
};
