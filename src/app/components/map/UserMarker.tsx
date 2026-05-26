import { Marker, Popup } from "react-leaflet";
import { userIcon } from "./mapIcons";

interface UserMarkerProps {
  position: { lat: number; lng: number } | null;
  addressName?: string;
}

export default function UserMarker({ position, addressName = "Vị trí giao hàng" }: UserMarkerProps) {
  if (!position) return null;

  return (
    <Marker position={[position.lat, position.lng]} icon={userIcon}>
      <Popup>
        <div className="p-1 max-w-xs">
          <p className="font-bold text-xs text-gray-900">Địa chỉ giao hàng</p>
          <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{addressName}</p>
        </div>
      </Popup>
    </Marker>
  );
}
