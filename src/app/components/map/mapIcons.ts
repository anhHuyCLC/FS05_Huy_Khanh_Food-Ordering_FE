import L from "leaflet";

// Premium DIV Icons matching rich UI theme
export const restaurantIcon = L.divIcon({
  className: "custom-restaurant-marker",
  html: `
    <div style="
      background-color: #FF4500;
      color: white;
      width: 34px;
      height: 34px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(255, 69, 0, 0.45);
      border: 2px solid white;
      font-size: 16px;
      transform: rotate(45deg);
    ">
      <div style="transform: rotate(-45deg);">🍔</div>
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

export const userIcon = L.divIcon({
  className: "custom-user-marker",
  html: `
    <div style="
      background-color: #1E90FF;
      color: white;
      width: 34px;
      height: 34px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(30, 144, 255, 0.45);
      border: 2px solid white;
      font-size: 16px;
    ">
      📍
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});

export const driverIcon = L.divIcon({
  className: "custom-driver-marker",
  html: `
    <div style="
      background-color: #32CD32;
      color: white;
      width: 34px;
      height: 34px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 14px rgba(50, 205, 50, 0.45);
      border: 2px solid white;
      font-size: 16px;
    ">
      🛵
    </div>
  `,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17],
});
