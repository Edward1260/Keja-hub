"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NotificationBell() {
  return (
    <Button variant="ghost" size="icon" className="relative rounded-full text-slate-600 hover:bg-slate-100">
      <Bell className="h-6 w-6" />
      <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
    </Button>
  );
}