"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

interface SidebarNavigationContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const SidebarNavigationContext = createContext<SidebarNavigationContextType | undefined>(undefined);

export function SidebarNavigationProvider({ children }: { children: ReactNode }) {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <SidebarNavigationContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </SidebarNavigationContext.Provider>
  );
}

export function useSidebarNavigation() {
  const context = useContext(SidebarNavigationContext);
  if (!context) {
    throw new Error("useSidebarNavigation must be used within a SidebarNavigationProvider");
  }
  return context;
}