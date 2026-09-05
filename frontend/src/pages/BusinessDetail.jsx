import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import * as Icons from "lucide-react";
import { ChevronRight, Star, MapPin, Clock, BadgeCheck, MessageCircle, Navigation,
  Share2, Phone, Globe, CheckCircle2, Send, AlertCircle } from "lucide-react";
import { getDetail, postLead } from "@/lib/nbk";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Seo } from "@/components/Seo";
import { MapView } from "@/components/MapView";
import { ShowNumber } from "@/components/ShowNumber";
import { BusinessCard } from "@/components/BusinessCard";
import { SaveButton } from "@/components/SaveButton";
import { Reviews } from "@/components/Reviews";
import { ClaimModal } from "@/components/ClaimModal";
import { OwnerEditor } from "@/components/OwnerEditor";
import { MediaLightbox } from "@/components/MediaUploader";
import { useAuth } from "@/context/AuthContext";

const iconMap = (name) => Icons[name?.split("-").map((s) => s[0].toUpperCase() + s.slice(1)).join("")] || Icons.Building2;
const ratingColor = (r) => (r >= 4.5 ? "bg-green-700" : r >= 4.0 ? "bg-green-600" : "bg-lime-600");

const Crumb = ({ items }) => (
  <nav className="py-3 px-4 sm:px-6 bg-slate-100 text-xs text-slate-600 border-b border-slate-200 overflow-x-auto whitespace-nowrap">
    <div className="max-w-7xl mx-auto flex items-center gap-1">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
          {it.to ? <Link to={it.to} className="hover:text-blue-600 transition-colors">{it.label}</Link> : <span className="text-slate-800 font-medium">{it.label}</span>}
        </span>
      ))}
    </div>
  </nav>
);

const Card = ({ title, children, testid }) => (
  <section data-testid={testid} className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6">
    {title && <h2 className="text-lg font-bold text-slate-900 mb-4">{title}</h2>}
    {children}
  </section>
);

export default function BusinessDetail() {
  const { category, state, city, slug } = useParams();
  const [data, setData] = useState(null);
  const [nf, setNf] = useState(false);
  const [gallery, setGallery] = useState(0);
  const [enquiry, setEnquiry] = useState(false);
  const [sent, setSent] = useState(false);
  const [claimOpen, setClaimOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const { user } = useAuth();

  const load = () => getDetail(category, state, city, slug).then(setData).catch(() => setNf(true));
  useEffect(() => {
    window.scrollTo(0, 0);
    setData(null); setNf(false);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, state, city, slug]);
  // Silent refresh when auth state resolves (saved / claim status are user-specific) — no loading flash.
  useEffect(() => {
    if (user) getDetail(category, state, city, slug).then(setData).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.user_id]);

  if (nf) return <div className="min-h-screen bg-slate-50"><Header /><div className="p-16 text-center text-slate-500">Business not found.</div><Footer /></div>;
  if (!data) return <div className="min-h-screen bg-slate-50"><Header /><div className="p-16 text-center text-slate-400">Loading…</div></div>;

  const { business: b, seo, services, hours, similar, claim } = data;
  const canonical = `https://nearbyok.com/${category}/${state}/${city}/${slug}`;
  const hoursObj = Array.isArray(hours) ? null : hours;
  const media = [...(b.videos || []), ...b.images.map((u) => ({ url: u, type: "image", thumb: u }))];

  const whatsapp = async () => {
    await postLead({ business_id: b.id, type: "whatsapp" });
    const num = b.phone.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${num}?text=${encodeURIComponent("Hi, I found your listing on nearbyok.com. I'd like to inquire about your services.")}`, "_blank");
  };
  const directions = async () => {
    await postLead({ business_id: b.id, type: "directions" });
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${b.lat},${b.lng}`, "_blank");
  };
  const submitEnquiry = async (e) => {
    e.preventDefault();
    await postLead({ business_id: b.id, type: "enquiry", caller: e.target.name.value, message: e.target.msg.value });
    setSent(true);
  };

  const jsonLd = [
    { "@context": "https://schema.org", "@type": "LocalBusiness", name: b.name,
      image: b.images, telephone: b.phone, address: { "@type": "PostalAddress", streetAddress: b.address, addressLocality: b.city_name, addressRegion: b.abbr, addressCountry: "US" },
      geo: { "@type": "GeoCoordinates", latitude: b.lat, longitude: b.lng },
      aggregateRating: { "@type": "AggregateRating", ratingValue: b.rating, reviewCount: b.reviews_count },
      url: canonical, priceRange: "$".repeat(b.price_level) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://nearbyok.com/" },
      { "@type": "ListItem", position: 2, name: b.city_name, item: `https://nearbyok.com/${category}/${state}/${city}` },
      { "@type": "ListItem", position: 3, name: b.category_name, item: `https://nearbyok.com/${category}/${state}/${city}` },
      { "@type": "ListItem", position: 4, name: b.name, item: canonical } ] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: seo.faqs.map((f) => ({
      "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Seo
        title={`${b.name} — ${b.category_singular} in ${b.area}, ${b.city_name} | ${b.rating}★ (${b.reviews_count}) | nearbyok.com`}
        description={seo.description.slice(0, 320)}
        canonical={canonical}
        jsonLd={jsonLd}
      />
      <Header />
      <Crumb items={[
        { label: "Home", to: "/" },
        { label: b.city_name, to: `/${category}/${state}/${city}` },
        { label: b.category_name, to: `/${category}/${state}/${city}` },
        { label: b.name },
      ]} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 w-full py-6 grid lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6 min-w-0">
          {/* Hero header */}
          <Card testid="business-hero">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{b.name}</h1>
                  {b.claimed ? <span data-testid="owner-verified-badge" className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-blue-600 px-2 py-1 rounded"><BadgeCheck className="w-3.5 h-3.5" /> Verified · Owner managed</span>
                    : b.verified && <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-1 rounded"><BadgeCheck className="w-3.5 h-3.5" /> Verified</span>}
                  {b.source === "owner" && !b.verified && <span data-testid="unverified-badge" className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded"><AlertCircle className="w-3.5 h-3.5" /> Unverified · Owner listed</span>}
                  {b.source === "google" && <span data-testid="google-source-badge" className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-100 px-2 py-1 rounded">Data via Google</span>}
                  {claim?.my_claim_status === "pending" && <span data-testid="claim-pending-badge" className="text-[10px] font-semibold uppercase tracking-wide text-amber-700 bg-amber-50 px-2 py-1 rounded">Your claim is under review</span>}
                </div>
                {b.tagline && <p className="text-sm text-slate-600 font-medium mt-1" data-testid="business-tagline">{b.tagline}</p>}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm">
                  <span className={`inline-flex items-center gap-1 ${ratingColor(b.rating)} text-white font-bold px-2 py-0.5 rounded`}>{b.rating} <Star className="w-3.5 h-3.5 fill-white" /></span>
                  <span className="text-slate-500">{b.reviews_count} Ratings</span>
                  <span className="text-slate-400">· {b.years} yrs in business</span>
                </div>
                <p className="text-sm text-slate-500 mt-2 flex items-center gap-1.5"><MapPin className="w-4 h-4 shrink-0" /> {b.address}</p>
                <p className={`text-sm mt-1 flex items-center gap-1.5 ${b.open_now ? "text-green-600" : "text-red-500"}`}><Clock className="w-4 h-4 shrink-0" /> {b.hours_status}</p>
              </div>
              <div className="flex items-center gap-2">
                <button data-testid="detail-share-btn" onClick={() => navigator.share?.({ title: b.name, url: window.location.href })} className="w-10 h-10 rounded-lg border border-slate-200 hover:border-slate-900 flex items-center justify-center transition-colors"><Share2 className="w-4 h-4 text-slate-600" /></button>
                <SaveButton businessId={b.id} initial={b.saved} />
              </div>
            </div>

            {/* CTA cluster */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
              <ShowNumber businessId={b.id} size="lg" testId="business-detail-show-number-button" />
              <button data-testid="business-detail-whatsapp-button" onClick={whatsapp} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-3.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"><MessageCircle className="w-4 h-4" /> WhatsApp</button>
              <button data-testid="business-detail-directions-button" onClick={directions} className="border border-slate-300 hover:border-slate-900 text-slate-700 font-semibold px-4 py-3.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"><Navigation className="w-4 h-4" /> Directions</button>
              <button data-testid="business-detail-enquiry-button" onClick={() => setEnquiry(true)} className="border border-slate-300 hover:border-slate-900 text-slate-700 font-semibold px-4 py-3.5 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"><Send className="w-4 h-4" /> Enquiry</button>
            </div>
          </Card>

          {/* Gallery (owner photos/videos first, then Google photos) */}
          <Card testid="gallery-card">
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-3">
              <button type="button" onClick={() => setLightbox(gallery)} className="relative w-full h-64 sm:h-80 rounded-lg overflow-hidden bg-slate-100" data-testid="gallery-main">
                {media[gallery]?.type === "video"
                  ? <video src={media[gallery].url} poster={media[gallery].thumb} controls playsInline className="w-full h-full object-cover" onClick={(e) => e.stopPropagation()} />
                  : <img src={media[gallery]?.url} alt={b.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />}
              </button>
              <div className={`grid ${media.length > 3 ? "grid-cols-4 sm:grid-cols-2" : "grid-cols-3 sm:grid-cols-1"} gap-3 sm:max-h-80 sm:overflow-y-auto`}>
                {media.map((m, i) => (
                  <button key={i} onClick={() => setGallery(i)} data-testid="gallery-thumb" className={`relative h-20 sm:h-[92px] rounded-lg overflow-hidden border-2 transition-colors ${gallery === i ? "border-orange-500" : "border-transparent"}`}>
                    <img src={m.thumb || m.url} alt="" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    {m.type === "video" && <span className="absolute inset-0 flex items-center justify-center bg-black/25"><Icons.PlayCircle className="w-7 h-7 text-white" /></span>}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">{media.length} photo{media.length === 1 ? "" : "s"}{b.videos?.length ? ` & video${b.videos.length === 1 ? "" : "s"}` : ""}{b.claimed ? " · uploaded by the owner and Google" : b.source === "google" ? " · via Google" : ""}</p>
          </Card>

          {/* Map + hours */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card title="Location">
              <MapView center={data.center} markers={[b]} height={240} activeId={b.id} />
              <p className="text-xs text-slate-500 mt-3">{b.address}</p>
            </Card>
            <Card title="Opening Hours">
              {hoursObj ? (
                <table className="w-full text-sm">
                  <tbody>
                    {Object.entries(hoursObj).map(([day, val]) => (
                      <tr key={day} className="border-b border-slate-50 last:border-0">
                        <td className="py-1.5 text-slate-600">{day}</td>
                        <td className={`py-1.5 text-right font-medium ${val === "Closed" ? "text-red-500" : "text-slate-800"}`}>{val}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <ul className="text-sm space-y-1 text-slate-700">{hours.map((h, i) => <li key={i}>{h}</li>)}</ul>
              )}
            </Card>
          </div>

          {/* Overview */}
          <Card title="Location and Overview">
            {b.editorial_summary && <p className="text-sm text-slate-800 font-medium leading-relaxed mb-3" data-testid="editorial-summary">{b.editorial_summary}</p>}
            <p className="text-sm text-slate-600 leading-relaxed">{seo.overview}</p>
            <p className="text-sm text-slate-600 leading-relaxed mt-3">{seo.description}</p>
          </Card>

          {/* Reviews */}
          <Card title={`Reviews & Ratings — ${b.name}`} testid="reviews-card">
            <Reviews key={b.id} businessId={b.id} google={data.reviews.google} users={data.reviews.users} googleTotal={b.reviews_count} googleMapsUri={b.google_maps_uri} />
          </Card>

          {/* Services */}
          <Card title="Products and Services Offered">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {services.map((s) => (
                <div key={s} className="flex items-center gap-2 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" /> {s}
                </div>
              ))}
            </div>
          </Card>

          {/* FAQ */}
          <Card title="Frequently Asked Questions">
            <FaqAccordion faqs={seo.faqs} />
          </Card>

          {/* Searched for */}
          <Card title={`People found ${b.name} by searching for`}>
            <div className="flex flex-wrap gap-2">
              {seo.searched_for.map((t) => (
                <span key={t} data-testid="searched-for-chip-link" className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 hover:bg-orange-50 hover:text-orange-800 transition-colors cursor-pointer">{t}</span>
              ))}
            </div>
          </Card>

          {/* Related searches */}
          <Card title="Related Searches">
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {seo.related_searches.map((t) => (
                <a key={t} data-testid="related-search-link" href="#" className="text-slate-500 hover:text-blue-600 transition-colors border-r border-slate-200 pr-4 last:border-0">{t}</a>
              ))}
            </div>
          </Card>

          {/* Similar listings */}
          {similar.length > 0 && (
            <Card title="Explore More Similar Listings">
              <div className="space-y-3">
                {similar.slice(0, 4).map((s) => <BusinessCard key={s.id} b={s} state={state} />)}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="lg:sticky lg:top-24 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
              <ShowNumber businessId={b.id} size="lg" testId="sidebar-show-number-button" />
              <button onClick={whatsapp} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors w-full"><MessageCircle className="w-4 h-4" /> WhatsApp Chat</button>
              {b.website && <a href={b.website} target="_blank" rel="noreferrer" className="border border-slate-300 hover:border-slate-900 text-slate-700 font-semibold px-4 py-3 rounded-lg flex items-center justify-center gap-2 text-sm transition-colors w-full"><Globe className="w-4 h-4" /> Website</a>}
              {b.google_maps_uri && <a href={b.google_maps_uri} target="_blank" rel="noreferrer" data-testid="google-maps-link" className="text-xs text-blue-600 hover:underline mt-1 inline-block">View on Google Maps →</a>}
              <p className="text-[11px] text-slate-400 text-center pt-1">{b.claimed ? "Contact details maintained by the business owner." : "Phone number sourced directly from Google. Call the business directly — no middleman."}</p>
            </div>

            {/* Claim / manage card */}
            {claim?.is_owner ? (
              <div className="bg-blue-600 text-white rounded-xl p-5" data-testid="owner-manage-card">
                <h3 className="font-bold flex items-center gap-2"><BadgeCheck className="w-5 h-5" /> You manage this listing</h3>
                <p className="text-sm text-blue-100 mt-1">Update hours, contact details, services and upload photos & videos.</p>
                <button data-testid="owner-manage-button" onClick={() => setEditOpen(true)} className="mt-4 w-full bg-white text-blue-700 font-bold py-2.5 rounded-lg text-sm hover:bg-blue-50">Manage listing</button>
              </div>
            ) : claim?.claimed ? (
              <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="claimed-card">
                <h3 className="font-bold text-slate-900 flex items-center gap-2"><BadgeCheck className="w-5 h-5 text-blue-600" /> Claimed & verified</h3>
                <p className="text-sm text-slate-500 mt-1">This page is managed by the business owner{claim.owner_name ? ` (${claim.owner_name})` : ""}. Details are kept up to date.</p>
              </div>
            ) : claim?.my_claim_status === "pending" ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5" data-testid="claim-pending-card">
                <h3 className="font-bold text-amber-800 flex items-center gap-2"><Clock className="w-5 h-5" /> Claim under review</h3>
                <p className="text-sm text-amber-700 mt-1">We're verifying your ownership. You'll be able to manage this page once approved (24–48 hrs).</p>
              </div>
            ) : b.source !== "owner" && (
              <div className="bg-white border border-slate-200 rounded-xl p-5" data-testid="claim-card">
                <h3 className="font-bold text-slate-900">Own {b.name}?</h3>
                <p className="text-sm text-slate-500 mt-1">Claim this free listing to add photos & videos, update hours and get the <span className="font-semibold text-blue-700">Verified</span> badge.</p>
                <button data-testid="claim-business-button" onClick={() => setClaimOpen(true)} className="mt-4 w-full border-2 border-slate-900 hover:bg-slate-900 hover:text-white text-slate-900 font-bold py-2.5 rounded-lg text-sm transition-colors">Claim this business</button>
              </div>
            )}

            {/* Ad slot */}
            <div className="border-2 border-dashed border-slate-300 bg-slate-100 rounded-xl h-60 flex items-center justify-center text-slate-400 text-sm">
              Advertisement
            </div>

            {/* Popular categories */}
            <div className="bg-white border border-slate-200 rounded-xl p-5">
              <h3 className="font-bold text-slate-900 mb-3">Popular Categories</h3>
              <div className="grid grid-cols-2 gap-2">
                {seo.categories.slice(0, 8).map((c) => {
                  const Icon = iconMap(c.icon);
                  return (
                    <Link key={c.slug} data-testid="popular-categories-tab" to={`/${c.slug}/${state}/${city}`} className="flex items-center gap-2 text-sm text-slate-600 hover:text-blue-600 transition-colors py-1">
                      <Icon className="w-4 h-4 text-orange-500 shrink-0" /> {c.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Nearby / popular city links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 w-full pb-10 space-y-6">
        <Card title={`${b.category_name} in nearby areas`}>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {seo.nearby_areas.map((a) => (
              <span key={a.area} className="text-slate-500 hover:text-blue-600 transition-colors border-r border-slate-200 pr-4 last:border-0 cursor-pointer">{b.category_name} in {a.area}</span>
            ))}
          </div>
        </Card>
        <Card title={`${b.category_name} in popular US cities`}>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {seo.popular_cities.map((c) => (
              <Link key={c.slug} data-testid="popular-cities-matrix-link" to={`/${category}/${c.state}/${c.slug}`} className="text-slate-500 hover:text-blue-600 transition-colors border-r border-slate-200 pr-4 last:border-0">{b.category_name} in {c.name}</Link>
            ))}
          </div>
        </Card>
      </div>

      {/* Enquiry modal */}
      {enquiry && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 flex items-center justify-center p-4" onClick={() => setEnquiry(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            {sent ? (
              <div className="text-center py-6">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto" />
                <h3 className="font-bold text-lg mt-3 text-slate-900">Enquiry Sent!</h3>
                <p className="text-sm text-slate-500 mt-1">{b.name} will get back to you shortly.</p>
                <button onClick={() => { setEnquiry(false); setSent(false); }} className="mt-5 bg-slate-900 text-white px-6 py-2.5 rounded-lg font-semibold text-sm">Close</button>
              </div>
            ) : (
              <form onSubmit={submitEnquiry} className="space-y-3">
                <h3 className="font-bold text-lg text-slate-900">Send Enquiry to {b.name}</h3>
                <input name="name" required placeholder="Your name" data-testid="enquiry-name-input" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                <textarea name="msg" required rows={4} placeholder="Your message…" data-testid="enquiry-message-input" className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-blue-500" />
                <button type="submit" data-testid="enquiry-submit-button" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"><Send className="w-4 h-4" /> Send Enquiry</button>
              </form>
            )}
          </div>
        </div>
      )}
      {claimOpen && <ClaimModal business={b} onClose={() => setClaimOpen(false)} onSubmitted={load} />}
      {editOpen && <OwnerEditor businessId={b.id} onClose={() => setEditOpen(false)} onSaved={() => { load(); setGallery(0); }} />}
      <MediaLightbox items={media} index={lightbox} onClose={() => setLightbox(null)} onIndex={setLightbox} />
      <Footer />
    </div>
  );
}

function FaqAccordion({ faqs }) {
  const [open, setOpen] = useState(0);
  return (
    <div className="divide-y divide-slate-100">
      {faqs.map((f, i) => (
        <div key={i} data-testid="faq-accordion-item" className="py-3">
          <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between text-left gap-4">
            <span className="font-semibold text-slate-800 text-sm">{i + 1}. {f.q}</span>
            <ChevronRight className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open === i ? "rotate-90" : ""}`} />
          </button>
          {open === i && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.a}</p>}
        </div>
      ))}
    </div>
  );
}
