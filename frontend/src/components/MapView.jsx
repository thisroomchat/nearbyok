import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const pin = (color) =>
  L.divIcon({
    className: "nbk-pin",
    html: `<div style="background:${color};width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });

export const MapView = ({ center, markers = [], height = 420, activeId = null }) => {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    mapRef.current = L.map(ref.current, { scrollWheelZoom: false }).setView([center.lat, center.lng], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);
    layerRef.current = L.layerGroup().addTo(mapRef.current);
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !layerRef.current) return;
    layerRef.current.clearLayers();
    const pts = [];
    markers.forEach((m) => {
      if (!m.lat || !m.lng) return;
      pts.push([m.lat, m.lng]);
      L.marker([m.lat, m.lng], { icon: pin(m.id === activeId ? "#ea580c" : "#2563eb") })
        .addTo(layerRef.current)
        .bindPopup(
          `<strong>${m.name}</strong><br/>⭐ ${m.rating} (${m.reviews_count})<br/>${m.address || ""}`
        );
    });
    if (pts.length > 1) {
      mapRef.current.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
    } else if (pts.length === 1) {
      mapRef.current.setView(pts[0], 14);
    }
  }, [JSON.stringify(markers.map((m) => m.id)), activeId]);

  return <div ref={ref} data-testid="leaflet-map-container" style={{ height, width: "100%" }} className="rounded-xl overflow-hidden border border-slate-200 z-0" />;
};
