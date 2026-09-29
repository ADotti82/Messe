/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Luogo } from '../types';

export interface LocationDetectionResult {
  latitude: number;
  longitude: number;
  proposedName: string;
  proposedAddress: string;
  matchedExistingPlace?: Luogo;
}

/**
 * Calculates distance between two coordinates in meters (Haversine formula)
 */
function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Gets current device position with fallback handling
 */
export async function getCurrentGPSPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error('La geolocalizzazione non è supportata dal browser'));
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        let msg = 'Errore nel rilevamento della posizione.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Autorizzazione GPS negata. Consenti l\'accesso alla posizione nelle impostazioni del browser.';
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          msg = 'Segnale GPS non disponibile.';
        } else if (err.code === err.TIMEOUT) {
          msg = 'Rilevamento posizione scaduto.';
        }
        reject(new Error(msg));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  });
}

/**
 * Performs reverse geocoding via our server proxy, checking user's existing places first
 */
export async function detectLocationAndResolvePlace(
  existingPlaces: Luogo[] = []
): Promise<LocationDetectionResult> {
  const coords = await getCurrentGPSPosition();

  // 1. Check if user is near one of their own frequently used places (within 150 meters)
  let closestMatch: Luogo | undefined;
  let minDistance = Infinity;

  for (const place of existingPlaces) {
    if (place.latitudine !== null && place.longitudine !== null) {
      const dist = calculateDistanceMeters(
        coords.latitude,
        coords.longitude,
        place.latitudine,
        place.longitudine
      );
      if (dist < 150 && dist < minDistance) {
        minDistance = dist;
        closestMatch = place;
      }
    }
  }

  if (closestMatch) {
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
      proposedName: closestMatch.nome,
      proposedAddress: closestMatch.indirizzo,
      matchedExistingPlace: closestMatch,
    };
  }

  // 2. Query Nominatim reverse geocode via server proxy
  try {
    const res = await fetch(`/api/geocode?lat=${coords.latitude}&lon=${coords.longitude}`);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};

      // Try to find a place of worship or church in address details
      const placeOfWorship =
        addr.place_of_worship ||
        addr.church ||
        addr.cathedral ||
        addr.chapel ||
        addr.building;

      const road = addr.road || addr.pedestrian || addr.street || '';
      const houseNumber = addr.house_number ? ` ${addr.house_number}` : '';
      const city = addr.city || addr.town || addr.village || addr.municipality || '';
      const formattedAddress = [road + houseNumber, city].filter(Boolean).join(', ');

      const proposedName =
        placeOfWorship ||
        (road && city ? `Chiesa in ${road}, ${city}` : city ? `Chiesa a ${city}` : 'Chiesa parrocchiale');

      return {
        latitude: coords.latitude,
        longitude: coords.longitude,
        proposedName: proposedName,
        proposedAddress: formattedAddress || data.display_name?.split(',').slice(0, 3).join(',') || '',
      };
    }
  } catch (err) {
    console.warn('Geocoding proxy error:', err);
  }

  // 3. Fallback: return coordinates
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    proposedName: '',
    proposedAddress: `Posizione GPS: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
  };
}
