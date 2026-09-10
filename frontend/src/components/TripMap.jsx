import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const numIcon = (n, color) =>
  L.divIcon({
    className: "trip-pin",
    html: `<div style="background:${color};color:#fff;font-weight:700;font-size:12px;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)">${n}</div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
    popupAnchor: [0, -13],
  });

// Ordered waypoints + route polyline. No Directions API needed — draws the
// travel line through geocoded stops in order.
export const TripMap = ({ waypoints = [], height = 380 }) => {
  const ref = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    mapRef.current = L.map(ref.current, { scrollWheelZoom: false }).setView([28.6, 77.2], 6);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
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
    waypoints.forEach((m, i) => {
      if (!m.lat || !m.lng) return;
      pts.push([m.lat, m.lng]);
      const color = m.type === "origin" ? "#16a34a" : m.type === "destination" ? "#dc2626" : "#ea580c";
      L.marker([m.lat, m.lng], { icon: numIcon(i + 1, color) })
        .addTo(layerRef.current)
        .bindPopup(`<strong>${m.name || ""}</strong><br/>${m.type || ""}`);
    });
    if (pts.length > 1) {
      L.polyline(pts, { color: "#ea580c", weight: 4, opacity: 0.75, dashArray: "1,8", lineCap: "round" }).addTo(layerRef.current);
      mapRef.current.fitBounds(pts, { padding: [40, 40], maxZoom: 12 });
    } else if (pts.length === 1) {
      mapRef.current.setView(pts[0], 12);
    }
  }, [JSON.stringify(waypoints.map((m) => [m.lat, m.lng]))]);

  return <div ref={ref} data-testid="trip-map" style={{ height, width: "100%" }} className="rounded-xl overflow-hidden border border-slate-200 z-0" />;
};
