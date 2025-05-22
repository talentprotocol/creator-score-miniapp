"use client";
import { useState } from "react";
import { Home, Features } from "../components/DemoComponents";

export default function DemoApp() {
  const [activeTab, setActiveTab] = useState("home");
  return (
    <div className="flex flex-col min-h-screen bg-[#111] text-white">
      <div className="w-full max-w-md mx-auto px-4 py-3">
        <header className="flex justify-between items-center mb-3 h-11">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab("home")}
              style={{ fontWeight: activeTab === "home" ? 700 : 400 }}
            >
              Home
            </button>
            <button
              onClick={() => setActiveTab("features")}
              style={{ fontWeight: activeTab === "features" ? 700 : 400 }}
            >
              Features
            </button>
          </div>
        </header>
        <main className="flex-1">
          {activeTab === "home" && <Home setActiveTab={setActiveTab} />}
          {activeTab === "features" && <Features setActiveTab={setActiveTab} />}
        </main>
      </div>
    </div>
  );
}
