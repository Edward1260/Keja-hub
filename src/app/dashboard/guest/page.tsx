"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useMemoFirebase, useDoc, useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { 
  Wallet, Sparkles, LayoutDashboard, Loader2, Search, 
  ChevronRight, Bell, LogOut, Building2, Lock, HelpCircle, UserCircle
} from "lucide-react";
import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger 
} from "@/components/ui/sidebar";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

export default function GuestDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6 text-foreground">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Syncing Dashboard</p>
          <p className="text-xs text-muted-foreground font-medium mt-2">Connecting to guest telemetry matrix...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const SectionHeading = ({ title }: { title: string }) => (
    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 pb-2 mb-6">{title}</h3>
  );

  const RestrictedActionCard = ({ icon: Icon, title, description }: any) => (
    <Card 
      onClick={() => toast({ title: "Protocol Restricted", description: "Please signup as a Tenant to initialize this module." })}
      className="group cursor-not-allowed bg-slate-50/50 border-none p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden text-foreground opacity-40 grayscale"
    >
      <div className="p-4 bg-white rounded-2xl w-fit mb-6 shadow-sm">
        <Icon className="h-6 w-6 text-slate-300" />
      </div>
      <h4 className="text-xl font-headline font-black text-slate-400 mb-2">{title}</h4>
      <p className="text-sm text-slate-300 font-medium leading-relaxed">{description}</p>
      <div className="absolute top-6 right-6 flex items-center gap-2">
        <Lock className="h-3 w-3 text-amber-500" />
        <Badge className="bg-amber-100 text-amber-600 border-none font-black text-[8px] uppercase tracking-widest">TENANT ONLY</Badge>
      </div>
    </Card>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50/50 flex w-full">
        <Sidebar className="border-r border-slate-200 glass" collapsible="icon">
          <SidebarHeader className="p-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl shadow-lg">
                <LayoutDashboard className="text-white h-5 w-5" />
              </div>
              <span className="font-headline font-black text-xl tracking-tighter text-primary group-data-[collapsible=icon]:hidden">Guest Hub</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4 text-foreground">
            <SidebarMenu className="space-y-1">
              {[
                { id: 'overview', label: 'Command Center', icon: <LayoutDashboard className="h-4 w-4" /> },
                { id: 'help', label: 'Support Info', icon: <HelpCircle className="h-4 w-4" /> }
              ].map(item => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={activeTab === item.id}
                    className={cn(
                      "px-6 h-12 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest gap-3", 
                      activeTab === item.id ? "bg-primary text-white shadow-lg" : "hover:bg-slate-100 text-slate-500"
                    )} 
                    onClick={() => setActiveTab(item.id)}
                  >
                    {item.icon} <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-slate-100">
            <Button variant="ghost" className="w-full justify-start gap-2 rounded-xl h-12 text-rose-500 hover:text-rose-600 font-black" onClick={() => signOut(auth)}>
              <LogOut className="h-4 w-4" /> <span className="group-data-[collapsible=icon]:hidden">End Session</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto">
          <header className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-8 mb-12 text-foreground">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <SidebarTrigger className="p-3 bg-slate-50 hover:bg-slate-100 text-primary rounded-full transition-colors" />
              <div>
                <h1 className="text-4xl font-headline font-black tracking-tighter text-slate-900">Guest View.</h1>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Identity Node: Restricted Access</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button className="rounded-full px-8 h-12 premium-gradient font-black text-white" asChild>
                <Link href="/login?tab=signup">Signup as Tenant</Link>
              </Button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                <Card className="premium-gradient text-white border-none p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-12 opacity-20"><Sparkles className="h-24 w-24" /></div>
                  <div className="max-w-2xl space-y-6 relative z-10">
                    <h2 className="text-4xl md:text-6xl font-headline font-black tracking-tight leading-[0.9]">Unlock Full Intelligence.</h2>
                    <p className="text-lg md:text-xl text-white/80 font-medium leading-relaxed">
                      You are currently in <strong>Read-Only Mode</strong>. Initialize a <strong>Tenant Profile</strong> to view verified assets, secure residency nodes, and access the M-Pesa financial hub.
                    </p>
                    <Button size="lg" className="rounded-2xl h-16 px-10 bg-white text-primary font-black text-xl hover:scale-105 transition-all shadow-xl" asChild>
                      <Link href="/login?tab=signup">Initialize Tenant Sync</Link>
                    </Button>
                  </div>
                </Card>

                <div className="space-y-8">
                  <SectionHeading title="Restricted Core Modules" />
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <RestrictedActionCard icon={Search} title="Intelligence Search" description="Access to the verified urban asset database is restricted." />
                    <RestrictedActionCard icon={Wallet} title="Financial Matrix" description="M-Pesa escrow protocols require tenant verification." />
                    <RestrictedActionCard icon={Building2} title="Active Residency" description="Managed unit tracking is unavailable for guest nodes." />
                  </div>
                </div>

                <div className="p-12 text-center bg-slate-900 text-white rounded-[4rem] relative overflow-hidden">
                   <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary to-transparent" />
                   <h3 className="text-3xl font-headline font-black mb-4 relative z-10">Ready to secure a home?</h3>
                   <p className="text-slate-400 font-medium mb-8 max-w-lg mx-auto relative z-10">Upgrade your status to access NairobiPad's neural booking system and verified host links.</p>
                   <Button variant="outline" className="h-14 rounded-full px-10 border-2 border-white/20 hover:bg-white hover:text-slate-900 font-black relative z-10" asChild>
                     <Link href="/login?tab=signup">Signup Now</Link>
                   </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </SidebarProvider>
  );
}
