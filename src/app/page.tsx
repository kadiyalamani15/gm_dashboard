import React from "react";
import Header from "@/components/Header";
import Map from "@/components/Map";

export default function Home() {
  return (
        <main className="w-screen h-screen flex flex-col overflow-hidden">
          {/* App Header */}
          <Header />

          {/* Map Container - Fullscreen Flex */}
          <section className="flex-1 relative">
            <Map />
          </section>
        </main>
  );
}
