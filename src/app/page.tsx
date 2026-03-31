
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2,
  ArrowRight,
  User,
  LogIn,
  Plus,
  Compass,
  ShieldCheck,
  Zap,
  Info
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PlaceHolderImages } from "@/lib/placeholder-images";

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const heroImage = PlaceHolderImages.find(img => img.id === 'welcome-keys');

  const messages = [
    "Welcome to NairobiPad",
    "Your Secure Urban Node",
    "Intelligence-Driven Residency",
    "Verified Asset Catalog",
    "M-Pesa Escrow Synchronized",
    "Decentralized Housing Matrix"
  ];

  useEffect(() => {
    setIsMounted(true);
    const timer = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="min-h-screen rough-wall overflow-hidden flex flex-col font-body selection:bg-primary/30">
      {/* 3D Hero Asset - Anchored Top-Right with Neural Blending */}
      <motion.div 
        initial={{ opacity: 0, x: 100, rotateY: 30 }}
        animate={{ opacity: 1, x: 0, rotateY: -10 }}
        transition={{ duration: 2, type: "spring", stiffness: 30 }}
        className="absolute top-0 right-0 w-[60%] h-[80%] z-0 perspective-2000 pointer-events-none"
      >
        <div className="relative w-full h-full mask-neural animate-float">
          <Image 
            src={heroImage?.imageUrl || "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200&q=80"}
            alt="Nairobi Residency Node"
            fill
            className="object-cover opacity-80"
            priority
            unoptimized
            data-ai-hint="hand keys city"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-transparent via-[#f59e0b]/20 to-[#f59e0b]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f59e0b] via-transparent to-transparent" />
        </div>
      </motion.div>

      {/* Top Protocol Bar - High Blur Glassmorphism */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed top-0 inset-x-0 z-[100] px-6 py-8 pointer-events-none"
      >
        <div className="container mx-auto flex items-center justify-between glass rounded-[2.5rem] px-10 h-20 shadow-2xl border-white/20 pointer-events-auto">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-slate-900 p-2.5 rounded-2xl group-hover:scale-110 transition-transform shadow-lg text-white">
              <Building2 className="h-6 w-6" />
            </div>
            <span className="font-headline font-black text-2xl tracking-tighter text-slate-900">NairobiPad</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="#" className="text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-slate-900 transition-colors flex items-center gap-2">
              <Info className="h-4 w-4" /> About Matrix
            </Link>
            <div className="h-8 w-px bg-slate-900/10 mx-2" />
            <div className="flex items-center gap-3">
              <Button variant="ghost" className="rounded-full px-6 h-11 font-black text-[10px] uppercase tracking-widest text-slate-700 hover:bg-white/20" asChild>
                <Link href="/dashboard/guest"><User className="h-4 w-4 mr-2" /> Guest Mode</Link>
              </Button>
              <Button variant="ghost" className="rounded-full px-6 h-11 font-black text-[10px] uppercase tracking-widest text-slate-900 border-2 border-slate-900/5 hover:bg-white/40 transition-all" asChild>
                <Link href="/login?tab=login"><LogIn className="h-4 w-4 mr-2" /> Login</Link>
              </Button>
              <Button className="rounded-full px-8 h-11 bg-slate-900 text-white font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-transform" asChild>
                <Link href="/login?tab=signup"><Plus className="h-4 w-4 mr-2" /> Join Platform</Link>
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Terminal Area */}
      <main className="flex-grow container mx-auto px-6 flex flex-col justify-center relative z-10 pt-20">
        
        <div className="space-y-16 max-w-3xl">
          <div className="h-[180px] relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={messages[currentMessage]}
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -60, opacity: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0 flex items-center"
              >
                <h2 className="text-5xl md:text-8xl font-headline font-black tracking-tighter text-slate-900 leading-none drop-shadow-2xl">
                  {messages[currentMessage]}.
                </h2>
              </motion.div>
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-8"
          >
            <p className="text-2xl md:text-3xl text-slate-900/60 font-medium leading-relaxed max-w-xl">
              Synchronizing urban expansion with verified residency nodes. 
              The future of Kenyan property management is active.
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <Button size="lg" className="h-20 px-12 rounded-3xl bg-slate-900 text-white text-xl font-black gap-4 shadow-2xl hover:scale-105 transition-transform group" asChild>
                <Link href="/login?tab=signup">
                  Execute Discovery <ArrowRight className="h-6 w-6 group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="h-20 px-12 rounded-3xl border-2 border-white/40 bg-white/10 backdrop-blur-md text-slate-900 text-xl font-black hover:bg-white/30 transition-all shadow-xl" asChild>
                <Link href="/dashboard/guest">Enter as Participant</Link>
              </Button>
            </div>
          </motion.div>

          <div className="flex flex-wrap gap-8">
            {[
              { icon: ShieldCheck, label: "Trust Node Active", color: "text-emerald-600" },
              { icon: Zap, label: "M-Pesa Integrated", color: "text-amber-600" },
              { icon: Compass, label: "Multi-City Catalog", color: "text-blue-600" }
            ].map((f, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 + (i * 0.2) }}
                className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-900/40"
              >
                <f.icon className={cn("h-4 w-4", f.color)} />
                {f.label}
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <motion.div 
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity }}
        className="fixed bottom-12 right-12 glass p-6 rounded-[2rem] shadow-xl border-white/10 hidden lg:block"
      >
        <div className="flex items-center gap-4">
          <div className="h-3 w-3 bg-emerald-500 rounded-full animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Global Ledger: SYNC_OK</p>
        </div>
      </motion.div>

      <div className="fixed bottom-12 left-12 pointer-events-none select-none opacity-10">
        <p className="text-[10px] font-black uppercase tracking-[1em] text-slate-900 rotate-90 origin-left">
          NAIROBIPAD_V4_INFRASTRUCTURE
        </p>
      </div>
    </div>
  );
}
