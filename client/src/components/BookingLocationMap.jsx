import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const destinationIcon = L.divIcon({
  className: "booking-map-dest-icon",
  html: '<span aria-hidden="true">📍</span>',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

const ROUTE_LINE_PATH = {
  color: "#1d4ed8",
  weight: 3,
  opacity: 0.92,
  dashArray: "10 8",
  lineCap: "round",
  lineJoin: "round",
};

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const DEBOUNCE_MS = 500;

const LOCATION_NOT_FOUND_MSG =
  "Location not found, try being more specific e.g. Flatbush, Auckland";

/**
 * Street number + street name + pickup suburb, comma-separated; omits empty parts.
 * `geocodeWithNominatim` appends ", New Zealand" (e.g. "48 Jerpoint Drive, Flatbush, Auckland, New Zealand").
 */
function buildPickupGeocodeQuery(streetNumber, streetName, pickupSuburb) {
  const num = streetNumber.trim();
  const name = streetName.trim();
  const suburb = pickupSuburb.trim();
  const streetLine = [num, name].filter(Boolean).join(" ").trim();
  return [streetLine, suburb].filter(Boolean).join(", ");
}

/** @param {string} query */
async function geocodeWithNominatim(query) {
  const q = query.trim();
  if (!q) return null;

  const qForNominatim = /new zealand/i.test(q) ? q : `${q}, New Zealand`;

  const url = new URL(NOMINATIM);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("q", qForNominatim);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Geocoding request failed (${res.status})`);
  }

  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;

  const { lat, lon } = data[0];
  return L.latLng(parseFloat(lat), parseFloat(lon));
}

function FitAfterGeocode({ pickup, destination, signal }) {
  const map = useMap();
  const prevSignal = useRef(0);
  const pickupRef = useRef(pickup);
  const destinationRef = useRef(destination);
  pickupRef.current = pickup;
  destinationRef.current = destination;

  useEffect(() => {
    if (signal === prevSignal.current) return;
    prevSignal.current = signal;

    const pts = [pickupRef.current, destinationRef.current].filter(Boolean);
    if (pts.length === 0) return;

    if (pts.length === 1) {
      map.setView(pts[0], 15, { animate: true });
      return;
    }

    map.fitBounds(L.latLngBounds(pts), { padding: [56, 56], maxZoom: 15 });
  }, [signal, map]);

  return null;
}

/**
 * @param {{
 *   pickupStreetNumber: string,
 *   pickupStreetName: string,
 *   pickupSuburb: string,
 *   destinationSuburb: string,
 * }} props
 */
export default function BookingLocationMap({
  pickupStreetNumber,
  pickupStreetName,
  pickupSuburb,
  destinationSuburb,
}) {
  const [pickup, setPickup] = useState(null);
  const [destination, setDestination] = useState(null);
  const [pickupErr, setPickupErr] = useState("");
  const [destErr, setDestErr] = useState("");
  const [fitSignal, setFitSignal] = useState(0);

  const pickupDebounce = useRef(0);
  const destDebounce = useRef(0);

  /** Destination: suburb only; `geocodeWithNominatim` adds ", New Zealand". */
  const destQuery = useMemo(() => {
    const s = destinationSuburb.trim();
    if (s.length < 2) return "";
    return s;
  }, [destinationSuburb]);

  const pickupQuery = useMemo(
    () =>
      buildPickupGeocodeQuery(
        pickupStreetNumber,
        pickupStreetName,
        pickupSuburb
      ),
    [pickupStreetNumber, pickupStreetName, pickupSuburb]
  );

  const bumpFit = useCallback(() => {
    setFitSignal((n) => n + 1);
  }, []);

  useEffect(() => {
    const line = pickupQuery.trim();
    if (line.length < 2) {
      clearTimeout(pickupDebounce.current);
      setPickup(null);
      setPickupErr("");
      return;
    }

    clearTimeout(pickupDebounce.current);
    setPickupErr("");

    pickupDebounce.current = window.setTimeout(() => {
      (async () => {
        try {
          const ll = await geocodeWithNominatim(line);
          if (ll) {
            setPickup(ll);
            bumpFit();
          } else {
            setPickup(null);
            setPickupErr(LOCATION_NOT_FOUND_MSG);
          }
        } catch (e) {
          setPickup(null);
          setPickupErr(e.message || "Pickup lookup failed.");
        }
      })();
    }, DEBOUNCE_MS);

    return () => clearTimeout(pickupDebounce.current);
  }, [pickupQuery, bumpFit]);

  useEffect(() => {
    if (!destQuery) {
      clearTimeout(destDebounce.current);
      setDestination(null);
      setDestErr("");
      return;
    }

    clearTimeout(destDebounce.current);
    setDestErr("");

    destDebounce.current = window.setTimeout(() => {
      (async () => {
        try {
          const ll = await geocodeWithNominatim(destQuery);
          if (ll) {
            setDestination(ll);
            bumpFit();
          } else {
            setDestination(null);
            setDestErr(LOCATION_NOT_FOUND_MSG);
          }
        } catch (e) {
          setDestination(null);
          setDestErr(e.message || "Destination lookup failed.");
        }
      })();
    }, DEBOUNCE_MS);

    return () => clearTimeout(destDebounce.current);
  }, [destQuery, bumpFit]);

  const defaultCenter = [-28.0, 134.0];
  const defaultZoom = 4;

  const pickupStatusText = !pickupErr
    ? pickup
      ? "Pickup pin placed — drag to adjust."
      : "Enter a pickup address to place the blue pin."
    : null;
  const destStatusText = !destErr
    ? destination
      ? "Destination pin placed — drag to adjust."
      : "Enter a destination suburb for the marker pin."
    : null;

  return (
    <div className="booking-map-block">
      <h2 className="booking-map-heading">Pickup & destination map</h2>
      <p className="booking-map-hint">
        Your pickup address and destination suburb are located with{" "}
        <a
          href="https://nominatim.org/"
          target="_blank"
          rel="noopener noreferrer"
        >
          OpenStreetMap Nominatim
        </a>
        . Drag a pin to fine-tune.
      </p>
      <div className="booking-map-wrap">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          className="booking-map-container"
          scrollWheelZoom
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitAfterGeocode
            pickup={pickup}
            destination={destination}
            signal={fitSignal}
          />
          {pickup && destination ? (
            <Polyline
              positions={[pickup, destination]}
              pathOptions={ROUTE_LINE_PATH}
            />
          ) : null}
          {pickup ? (
            <Marker
              position={pickup}
              icon={DefaultIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  setPickup(e.target.getLatLng());
                },
              }}
            />
          ) : null}
          {destination ? (
            <Marker
              position={destination}
              icon={destinationIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  setDestination(e.target.getLatLng());
                },
              }}
            />
          ) : null}
        </MapContainer>
      </div>
      {(pickupErr || destErr) && (
        <p className="booking-map-nominatim-err" role="alert">
          {pickupErr && destErr && pickupErr === destErr ? (
            <span>{pickupErr}</span>
          ) : pickupErr && destErr ? (
            <>
              <span>{pickupErr}</span>
              <br />
              <span>{destErr}</span>
            </>
          ) : (
            <span>{pickupErr || destErr}</span>
          )}
        </p>
      )}
      <div className="booking-map-status" aria-live="polite">
        {pickupStatusText ? <span>{pickupStatusText}</span> : null}
        {pickupStatusText && destStatusText ? <span> · </span> : null}
        {destStatusText ? <span>{destStatusText}</span> : null}
      </div>
    </div>
  );
}
