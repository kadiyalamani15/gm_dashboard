'use client';

import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

const MBTA_API_BASE_URL = 'https://api-v3.mbta.com';
const REFRESH_INTERVAL = 2500; // 2.5 seconds
const MBTA_TRAIN_ICON_URL = 'https://www.mbta.com/icon-svg/icon-vehicle-bordered-expanded.svg';

interface LiveTrainMarkersProps {
  map: maplibregl.Map | null;
  activeFilters: { [key: string]: boolean };
}

interface TrainAttributes {
  latitude: number;
  longitude: number;
  label: string;
  bearing: number;
}

interface TrainData {
  id: string;
  attributes: TrainAttributes;
  relationships: {
    route: {
      data: {
        id: string;
      };
    };
  };
}

interface TrainAPIResponse {
  data: TrainData[];
}

export default function LiveTrainMarkers({ map, activeFilters }: LiveTrainMarkersProps) {
  const trainMarkers = useRef(new Map<string, { marker: maplibregl.Marker; route: string; visible: boolean }>());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchedData = useRef<string | null>(null);

  useEffect(() => {
    if (!map) return;

    console.log("✅ useEffect triggered (Live Train Markers)");

    const fetchLiveTrains = async () => {
      console.log(`⏳ Fetching live train data...`);

      try {
        const response = await fetch(
          `${MBTA_API_BASE_URL}/vehicles?filter[route]=Red,Blue,Orange,Green-B,Green-C,Green-D,Green-E,CR-Fairmount,CR-Fitchburg,CR-Worcester,CR-Franklin,CR-Greenbush,CR-Haverhill,CR-Kingston,CR-Lowell,CR-Middleborough,CR-Needham,CR-Newburyport,CR-Providence,CR-Foxboro`
        );

        if (response.status === 429) {
          console.warn(`⚠️ Rate limit hit (429). Skipping this fetch.`);
          return;
        }

        const trainData: TrainAPIResponse = await response.json();
        const dataString = JSON.stringify(trainData.data);

        // 🛑 Skip processing if data hasn't changed
        if (lastFetchedData.current === dataString) {
          console.log("🔄 No change in train data. Skipping update.");
          return;
        }
        lastFetchedData.current = dataString;

        console.log(`✅ Fetch successful at ${new Date().toLocaleTimeString()}`);

        trainData.data.forEach((train) => {
          const trainId = train.id;
          const routeId = train.relationships.route.data.id;
          const { latitude, longitude, label, bearing } = train.attributes;

          if (!latitude || !longitude) return;

          // ✅ If marker exists, update its position (DO NOT reset visibility)
          if (trainMarkers.current.has(trainId)) {
            const existingMarker = trainMarkers.current.get(trainId)!;
            existingMarker.marker.setLngLat([longitude, latitude]);
          } else {
            // 🔹 Define custom marker ONCE before fetching API
            const customMarkerElement = document.createElement('div');
            customMarkerElement.style.backgroundImage = `url(${MBTA_TRAIN_ICON_URL})`;
            customMarkerElement.style.backgroundSize = 'contain';
            customMarkerElement.style.width = '16px';
            customMarkerElement.style.height = '16px';
            customMarkerElement.style.cursor = 'pointer';

            // ✅ Add custom marker to map
            const marker = new maplibregl.Marker({ element: customMarkerElement })
              .setLngLat([longitude, latitude])
              .setPopup(new maplibregl.Popup().setHTML(`<b>Train ${label}</b>`))
              .setRotation(bearing)
              .addTo(map);

            // ✅ Store marker along with its route and visibility state
            trainMarkers.current.set(trainId, { marker, route: routeId, visible: activeFilters[routeId] ?? true });
          }
        });

      } catch (err) {
        console.error(`❌ Error fetching live train locations:`, err);
      }
    };

    if (!intervalRef.current) {
      fetchLiveTrains();
      intervalRef.current = setInterval(fetchLiveTrains, REFRESH_INTERVAL);
    }

    return () => {
      console.log("🛑 Cleanup: Clearing interval ONLY ON UNMOUNT");
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [map]); // ✅ Do not include `activeFilters` to prevent re-fetching

  // ✅ Effect for toggling visibility (DOES NOT trigger API calls)
  useEffect(() => {
    if (!map) return;

    trainMarkers.current.forEach(({ marker, route }, trainId) => {
      const isRouteVisible = activeFilters[route] ?? true;
      const wasPreviouslyHidden = trainMarkers.current.get(trainId)?.visible === false;

      // ✅ If toggled ON, show the marker again
      if (isRouteVisible && wasPreviouslyHidden) {
        marker.getElement().style.display = "block";
        trainMarkers.current.set(trainId, { marker, route, visible: true });
      } 
      // ✅ If toggled OFF, keep it hidden
      else if (!isRouteVisible) {
        marker.getElement().style.display = "none";
        trainMarkers.current.set(trainId, { marker, route, visible: false });
      }
    });

  }, [activeFilters]); // ✅ Only affects visibility, no API call

  return null;
}
