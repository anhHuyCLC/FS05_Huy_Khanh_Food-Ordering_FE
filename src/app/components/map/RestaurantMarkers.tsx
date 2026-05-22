import { Marker, Popup } from "react-leaflet";
import { restaurantIcon } from "./MapView";

export interface RestaurantMarkerData {
  id: string;
  name: string;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  description?: string | null;
}

interface RestaurantMarkersProps {
  restaurants: RestaurantMarkerData[];
  onSelectRestaurant?: (restaurant: RestaurantMarkerData) => void;
}

// Stable coords helper matching backend coordinate generators
function getStableCoords(id: string, text: string): [number, number] {
  const input = `${id}-${text}`;
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = input.charCodeAt(i) + ((hash << 5) - hash);
  }
  const lat = 16.054404 + ((hash % 100) / 1000);
  const lon = 108.202167 + (((hash >> 2) % 100) / 1000);
  return [lat, lon];
}

export default function RestaurantMarkers({
  restaurants,
  onSelectRestaurant,
}: RestaurantMarkersProps) {
  return (
    <>
      {restaurants.map((r) => {
        const lat = r.latitude ? parseFloat(r.latitude) : null;
        const lng = r.longitude ? parseFloat(r.longitude) : null;

        const coords: [number, number] =
          lat && lng && !isNaN(lat) && !isNaN(lng)
            ? [lat, lng]
            : getStableCoords(r.id, r.name || "");

        return (
          <Marker
            key={r.id}
            position={coords}
            icon={restaurantIcon}
            eventHandlers={{
              click: () => {
                if (onSelectRestaurant) {
                  onSelectRestaurant(r);
                }
              },
            }}
          >
            <Popup>
              <div className="p-1 max-w-xs">
                <p className="font-bold text-sm text-gray-900">{r.name}</p>
                {r.description && <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>}
                {r.address && <p className="text-[11px] text-gray-400 mt-1 italic">{r.address}</p>}
                {onSelectRestaurant && (
                  <button
                    onClick={() => onSelectRestaurant(r)}
                    className="mt-2 w-full py-1 text-center bg-[#FF4500] hover:bg-orange-600 text-white rounded text-[10px] font-bold transition-colors cursor-pointer"
                  >
                    Xem thực đơn
                  </button>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
}
