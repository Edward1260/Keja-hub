"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { 
  Wallet, Sparkles, LayoutDashboard, Loader2, Wrench, FileText, ShieldCheck, Search, 
  ChevronRight, MessageSquare, Plus, CheckCircle2, Bell, LogOut, MapPin, Building2, 
  Zap, Filter, Heart, Clock, UserPlus, Users, MessageCircle, Radar, 
  CreditCard, Map, ArrowLeftRight, Share2, Download, History, RefreshCcw, 
  Receipt, Ticket, UserCircle, Key, Shield, Settings, 
  Moon, Sun, Calculator, Star, Eye, PhoneCall, HelpCircle, AlertCircle, TrendingUp, Landmark
} from "lucide-react";
import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger 
} from "@/components/ui/sidebar";
import { collection, query, where, limit, doc, orderBy } from "firebase/firestore";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { getTrustScoreInfo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar as RechartsRadar } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { motion, AnimatePresence } from "framer-motion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Image from "next/image";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { NotificationBell } from "@/components/notifications/notification-bell";

export default function TenantsDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const userRef = useMemoFirebase(() => (db && user) ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading && (!user || profile?.role !== "Tenant")) {
      if (user && profile) {
        const target = profile.role === 'Admin' ? '/dashboard/admin' : 
                       profile.role === 'Landlord' ? '/dashboard/landlord' : 
                       profile.role === 'Agent' ? '/dashboard/agent' : '/dashboard/guest';
        router.push(target);
      } else if (!user && !isUserLoading) {
        router.push("/");
      }
    }
  }, [user, profile, isUserLoading, isProfileLoading, router]);

  const bookingsQuery = useMemoFirebase(() => 
    (db && user && profile?.role === 'Tenant') ? query(collection(db, "bookings"), where("tenantId", "==", user.uid)) : null, 
    [db, user, profile]
  );
  const { data: bookings, isLoading: isBookingsLoading } = useCollection(bookingsQuery);

  const activeBooking = useMemo(() => 
    bookings?.find(b => b.status === 'Paid' || b.status === 'Active' || b.status === 'Reserved'),
    [bookings]
  );

  const propertyRef = useMemoFirebase(() => 
    (db && activeBooking?.propertyId) ? doc(db, "properties", activeBooking.propertyId) : null, 
    [db, activeBooking]
  );
  const { data: activeProperty } = useDoc(propertyRef);

  const paymentsQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, "bookings"), where("tenantId", "==", user.uid), where("status", "==", "paid"), limit(12)) : null, 
    [db, user]
  );
  const { data: payments } = useCollection(paymentsQuery);

  const trustData = useMemo(() => {
    if (!payments || payments.length === 0) {
      return [
        { subject: 'Payments', A: 0, fullMark: 150 },
        { subject: 'Verification', A: 0, fullMark: 150 },
        { subject: 'Communication', A: 0, fullMark: 150 },
        { subject: 'Reliability', A: 0, fullMark: 150 },
        { subject: 'Security', A: 75, fullMark: 150 },
      ];
    }
    const onTimePayments = payments.filter((p: any) => {
      const dueDate = p.dueDate?.toDate();
      const now = new Date();
      return dueDate && dueDate > now;
    }).length;
    const paymentScore = Math.min(150, (onTimePayments / payments.length) * 150);
    
    return [
      { subject: 'Payments', A: paymentScore, fullMark: 150 },
      { subject: 'Verification', A: profile?.isVerified ? 150 : 75, fullMark: 150 },
      { subject: 'Communication', A: 86, fullMark: 150 }, // From chat count later
      { subject: 'Reliability', A: 99, fullMark: 150 }, // From reviews
      { subject: 'Security', A: 130, fullMark: 150 },
    ];
  }, [payments, profile]);

  if (isUserLoading || (user && isProfileLoading)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6 text-foreground">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Syncing Dashboard</p>
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== "Tenant") return null;

  const StandardActionCard = ({ icon: Icon, label, onClick, variant = "outline" }: any) => (
    <Button 
      variant={variant}
      onClick={onClick || (() => toast({ title: "Module Locked" }))}
      className={cn(
        "h-auto py-8 flex-col gap-4 rounded-[2rem] border-2 transition-all hover:scale-[1.02] active:scale-95 group w-full",
        variant === "outline" ? "bg-white border-slate-100 hover:border-primary hover:bg-primary/5" : "premium-gradient border-none shadow-lg text-white"
      )}
    >
      <div className={cn("p-4 rounded-2xl transition-colors", variant === "outline" ? "bg-slate-50 group-hover:bg-primary group-hover:text-white" : "bg-white/20 text-white")}>
        <Icon className="h-6 w-6" />
      </div>
      <span className={cn("text-[10px] font-black uppercase tracking-widest", variant === "outline" ? "text-slate-600" : "text-white")}>{label}</span>
    </Button>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50/50 flex w-full text-foreground">
        <Sidebar className="border-r border-slate-200 glass" collapsible="icon">
          <SidebarHeader className="p-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
              <div className="bg-primary p-2 rounded-xl shadow-lg">
                <LayoutDashboard className="text-white h-5 w-5" />
              </div>
              <span className="font-headline font-black text-xl tracking-tighter text-primary group-data-[collapsible=icon]:hidden">Tenants Hub</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4">
            <SidebarMenu className="space-y-1 text-foreground">
              {[
                { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
                { id: 'rentals', label: 'My Units', icon: <Building2 className="h-4 w-4" /> },
                { id: 'financials', label: 'Financials', icon: <CreditCard className="h-4 w-4" /> },
                { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> }
              ].map(item => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton isActive={activeTab === item.id} onClick={() => setActiveTab(item.id)} className={cn("px-6 h-12 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest gap-3", activeTab === item.id ? "bg-primary text-white shadow-lg" : "hover:bg-slate-100 text-slate-500")}>
                    {item.icon} <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-slate-100 text-foreground">
            <Button variant="ghost" className="w-full justify-start gap-2 rounded-xl h-12 text-rose-500 hover:text-rose-600 font-black" onClick={() => signOut(auth)}>
<span className="group-data-[collapsible=icon]:hidden">Logout</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto text-foreground">
          <header className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-8 mb-12 text-foreground">
            <div className="flex items-center gap-6 w-full md:w-auto text-foreground">
              <SidebarTrigger className="p-3 bg-slate-50 hover:bg-slate-100 text-primary rounded-full transition-colors" />
              <div className="text-foreground">
                <h1 className="text-4xl font-headline font-black tracking-tighter text-slate-900">Resident Center.</h1>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">Sync node active: {user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-foreground">
              <NotificationBell />
              <div 
                className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setIsProfileOpen(true)}
              >
                {profile?.photoUrl ? (
                  <img src={profile.photoUrl} className="h-full w-full object-cover" />
                ) : <UserCircle className="h-8 w-8 text-primary" />}
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 text-foreground">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-foreground">
                  <Card className="bg-white border-none p-10 rounded-[3rem] shadow-xl shadow-slate-900/5 relative overflow-hidden group text-foreground">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Wallet className="h-12 w-12 text-primary" /></div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Escrow Value</p>
                    <h3 className="text-5xl font-headline font-black tracking-tighter text-slate-900">KES {bookings?.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0).toLocaleString() || '0'}</h3>
                    <div className="flex items-center gap-2 mt-6"><ShieldCheck className="h-5 w-5 text-emerald-500" /><span className="text-[10px] font-black uppercase text-emerald-500">Escrow Secure</span></div>
                  </Card>
                  <Card className="bg-white border-none p-10 rounded-[3rem] shadow-xl shadow-slate-900/5 text-foreground">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Identity Trust</p>
                    {isMounted && (
                      <div className="h-[180px] w-full text-foreground">
                        <ChartContainer config={{ value: { label: "Reputation", color: "hsl(var(--primary))" } }}>
                          <RadarChart data={trustData}>
                            <PolarGrid stroke="#f1f5f9" />
                            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 8, fontWeight: 900 }} />
                            <RechartsRadar name="Trust" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                          </RadarChart>
                        </ChartContainer>
                      </div>
                    )}
                  </Card>
                  <Card className="premium-gradient text-white border-none p-10 rounded-[3rem] shadow-2xl relative overflow-hidden text-foreground text-foreground">
                    <div className="absolute top-0 right-0 p-8 opacity-20"><Sparkles className="h-12 w-12" /></div>
                    <h3 className="text-3xl font-headline font-black tracking-tight mb-4 leading-tight">Neural Matcher.</h3>
                    <Button variant="outline" className="w-full h-16 rounded-2xl bg-white/20 border-white/40 text-white font-black hover:bg-white hover:text-primary transition-all text-lg" asChild>
                      <Link href="/search">Execute Sync</Link>
                    </Button>
                  </Card>
                </div>

                <div className="space-y-8 text-foreground">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 pb-2 mb-6">Communication Nodes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-foreground">
                    {activeBooking ? (
                      <>
                        <StandardActionCard icon={MessageCircle} label="Contact Host" onClick={() => router.push(`/chat/${user.uid}_${activeBooking.landlordId}`)} variant="default" />
                        <StandardActionCard icon={PhoneCall} label="Call Authority" onClick={() => window.open(`tel:+254700000000`)} />
                      </>
                    ) : (
                      <Card className="col-span-full p-12 text-center glass border-dashed rounded-[3rem] border-slate-200 text-foreground">
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest text-foreground">No active residency nodes to communicate with.</p>
                      </Card>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'rentals' && (
              <motion.div key="rentals" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12 text-foreground">
                {activeProperty ? (
                  <div className="grid lg:grid-cols-3 gap-12 text-foreground">
                    <Card className="lg:col-span-2 bg-white border-none p-10 rounded-[4rem] shadow-xl shadow-slate-900/5 space-y-10 overflow-hidden text-foreground">
                      <div className="relative aspect-video rounded-[3rem] overflow-hidden text-foreground">
                        <Image src={activeProperty.imageUrl || `https://picsum.photos/seed/${activeProperty.id}/800/600`} alt={activeProperty.title} fill unoptimized className="object-cover" />
                      </div>
                      <div className="space-y-2 text-foreground">
                        <h3 className="text-4xl font-headline font-black tracking-tight text-slate-900">{activeProperty.title}</h3>
                        <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest"><MapPin className="h-4 w-4" /> {activeProperty.location}</div>
                      </div>
                      <Button className="w-full h-16 rounded-[2rem] bg-slate-900 text-white font-black" asChild><Link href={`/properties/${activeProperty.id}`}>Full Protocol Specs</Link></Button>
                    </Card>
                    <div className="space-y-6 text-foreground text-foreground">
                      <StandardActionCard icon={Wrench} label="Log Deficiency" onClick={() => router.push("/my-rental")} />
                      <StandardActionCard icon={FileText} label="View Lease Node" />
                    </div>
                  </div>
                ) : (
                  <Card className="p-24 text-center glass border-dashed rounded-[4rem] border-slate-200 text-foreground">
                    <Building2 className="h-20 w-20 text-slate-200 mx-auto mb-8 opacity-20" />
                    <Button className="mt-8 rounded-full px-10 h-14 premium-gradient font-black shadow-xl text-white" asChild><Link href="/search">Execute Search</Link></Button>
                  </Card>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
      <ProfileSettings open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </SidebarProvider>
  );
}