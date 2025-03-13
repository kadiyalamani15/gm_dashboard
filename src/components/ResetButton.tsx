"use client";

import { MutableRefObject } from "react";
import { Button } from "@/components/ui/button";
import { LocateFixed } from "lucide-react"; // Import the icon from shadcn/lucide-react
import maplibregl from "maplibre-gl";

// Default map settings
const DEFAULT_CENTER: [number, number] = [-71.076639, 42.34268];
const DEFAULT_ZOOM = 12;

interface ResetButtonProps {
  mapInstance: MutableRefObject<maplibregl.Map | null>;
}

const ResetButton: React.FC<ResetButtonProps> = ({ mapInstance }) => {
  const resetMap = () => {
    if (mapInstance.current) {
      mapInstance.current.flyTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
    }
  };

  return (
    <Button
      className="absolute top-52 right-4 z-10 bg-black text-white p-2 rounded-full shadow-md hover:bg-gray-800 transition w-14 h-14"
      onClick={resetMap}
      size="icon" // Makes button circular, recommended in shadcn UI
    >
      <LocateFixed style={{ width: "32px", height: "32px" }} /> {/* Adjust size to match UI */}
    </Button>
  );
};

export default ResetButton;
