export interface AddressInfo {
  address: string;
  lat: number;
  lng: number;
}

export interface RouteState {
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
  eta: number; // in minutes
  shippingFee: number; // in VND
}
