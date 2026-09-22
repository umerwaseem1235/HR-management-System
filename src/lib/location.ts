export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface OfficeLocationConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export const DEFAULT_OFFICE_LOCATION: OfficeLocationConfig = {
  latitude: 32.180210165328184,
  longitude: 74.18567218742997,
  radiusMeters: 500,
};

export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371000;
  const lat1Rad = (coord1.latitude * Math.PI) / 180;
  const lat2Rad = (coord2.latitude * Math.PI) / 180;
  const deltaLatRad = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const deltaLngRad = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function isWithinOfficeRadius(
  employeeLocation: Coordinates,
  officeConfig: OfficeLocationConfig = DEFAULT_OFFICE_LOCATION
): { within: boolean; distance: number } {
  const distance = calculateDistance(employeeLocation, {
    latitude: officeConfig.latitude,
    longitude: officeConfig.longitude,
  });
  return {
    within: distance <= officeConfig.radiusMeters,
    distance: Math.round(distance),
  };
}

export function getOfficeLocationConfig(): OfficeLocationConfig {
  return {
    latitude: Number(process.env.NEXT_PUBLIC_OFFICE_LATITUDE) || DEFAULT_OFFICE_LOCATION.latitude,
    longitude: Number(process.env.NEXT_PUBLIC_OFFICE_LONGITUDE) || DEFAULT_OFFICE_LOCATION.longitude,
    radiusMeters: Number(process.env.NEXT_PUBLIC_OFFICE_RADIUS_METERS) || DEFAULT_OFFICE_LOCATION.radiusMeters,
  };
}