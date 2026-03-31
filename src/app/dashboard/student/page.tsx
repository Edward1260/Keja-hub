
"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PropertyCard } from "@/components/property/property-card";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc, useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { 
  Wallet, Sparkles, LayoutDashboard, Loader2, Wrench, FileText, ShieldCheck, Search, 
  ChevronRight, MessageSquare, Plus, CheckCircle2, Bell, LogOut, MapPin, Building2, 
  Zap, Filter, Heart, Clock, UserPlus, Users, MessageCircle, Radar, 
  CreditCard, Map, ArrowLeftRight, Share2, Download, History, RefreshCcw, 
  LogOut as LeaveIcon, Receipt, Ticket, UserCircle, Key, Shield, Settings, 
  Moon, Sun, Calculator, Star, Eye, PhoneCall, HelpCircle
} from "lucide-react";
import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger 
} from "@/components/ui/sidebar";
import { collection, query, where, limit, doc, serverTimestamp, orderBy } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { getTrustScoreInfo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar as RechartsRadar, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [isProcessingSTK, setIsProcessingSTK] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  const bookingsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "bookings"), where("tenantId", "==", user.uid));
  }, [db, user]);
  const { data: bookings } = useCollection(bookingsQuery);

  const propertiesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "properties"), limit(20));
  }, [db]);
  const { data: allProperties } = useCollection(propertiesQuery);

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
      { subject: 'Communication', A: 86, fullMark: 150 },
      { subject: 'Reliability', A: 99, fullMark: 150 },
      { subject: 'Security', A: 130, fullMark: 150 },
    ];
  }, [payments, profile]);

  const handleMpesaSTK = () => {
    setIsProcessingSTK(true);
    setTimeout(() => {
      setIsProcessingSTK(false);
      toast({ title: "STK Packet Transmitted", description: "Identity verification required on mobile handset." });
    }, 2000);
  };

  if (isUserLoading || isProfileLoading || !user) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  const trust = getTrustScoreInfo(profile?.trustScore || 80);

  const ActionSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="space-y-6">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 pb-2">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {children}
      </div>
    </div>
  );

  const ActionButton = ({ icon: Icon, label, onClick, className, variant = "outline" }: any) => (
    <Button 
      variant={variant}
      onClick={onClick}
      className={cn(
        "h-auto py-6 flex-col gap-3 rounded-3xl border-2 transition-all hover:scale-[1.02] active:scale-95 group",
        variant === "outline" ? "bg-white border-slate-100 hover:border-sky-500 hover:bg-sky-50/50" : "",
        className
      )}
    >
      <div className={cn("p-3 rounded-2xl transition-colors", variant === "outline" ? "bg-slate-50 group-hover:bg-sky-500 group-hover:text-white" : "bg-white/20")}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest leading-tight text-center max-w-[80px]">{label}</span>
    </Button>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-sky-50/30 flex w-full">
        <Sidebar className="border-r border-sky-100 glass">
          <SidebarHeader className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-sky-500 p-2 rounded-xl shadow-lg shadow-sky-200">
                <LayoutDashboard className="text-white h-5 w-5" />
              </div>
              <span className="font-headline font-black text-xl tracking-tighter text-sky-900">Student Hub</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="px-4 py-2 space-y-1">
              {[
                { id: 'overview', label: 'Command Center', icon: <LayoutDashboard className="h-4 w-4 mr-2" /> },
                { id: 'actions', label: 'Neural Matrix', icon: <Zap className="h-4 w-4 mr-2" /> },
                { id: 'residencies', label: 'My Units', icon: <Building2 className="h-4 w-4 mr-2" /> },
                { id: 'network', label: 'Identity Pool', icon: <Users className="h-4 w-4 mr-2" /> }
              ].map(item => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={activeTab === item.id}
                    className={cn("px-4 h-12 rounded-xl transition-all font-black uppercase text-[10px] tracking-widest", activeTab === item.id ? "bg-sky-500 text-white shadow-lg" : "hover:bg-sky-100")} 
                    onClick={() => setActiveTab(item.id)}
                  >
                    {item.icon} {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-sky-100">
            <Button variant="ghost" className="w-full justify-start gap-2 rounded-xl h-12 text-red-500 hover:text-red-600 font-black" onClick={() => signOut(auth)}>
              <LogOut className="h-4 w-4" /> End Session
            </Button>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col p-8 space-y-12 overflow-y-auto">
          <header className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-sky-50">
            <div className="flex items-center gap-6">
              <SidebarTrigger className="p-3 bg-sky-50 hover:bg-sky-100 text-sky-600 rounded-full transition-colors" />
              <div>
                <h1 className="text-4xl font-headline font-black tracking-tighter text-sky-900">Resident Center.</h1>
                <p className="text-xs text-muted-foreground font-black uppercase tracking-widest mt-1">Host Identity: {profile?.firstName || user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full h-14 w-14 bg-sky-50 text-sky-600 relative">
                <Bell className="h-6 w-6" />
                <span className="absolute top-4 right-4 h-3 w-3 bg-rose-500 rounded-full border-2 border-white" />
              </Button>
              <Badge className="bg-sky-50 text-sky-600 border-none font-black px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest">Protocol Active</Badge>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Card className="bg-white border-none p-10 rounded-[3rem] shadow-xl shadow-sky-900/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Wallet className="h-12 w-12 text-sky-500" /></div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Total Rental Yield Flow</p>
                    <h3 className="text-5xl font-headline font-black tracking-tighter text-sky-900">KES {bookings?.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0).toLocaleString() || '0'}</h3>
                    <div className="flex items-center gap-2 mt-6"><ShieldCheck className="h-5 w-5 text-emerald-500" /><span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">M-Pesa Escrow Synchronized</span></div>
                  </Card>
                  
                  <Card className="bg-white border-none p-10 rounded-[3rem] shadow-xl shadow-sky-900/5 group">
                    <div className="flex justify-between items-start mb-6">
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Identity Reputation</p>
                      <h3 className={cn("text-3xl font-headline font-black", trust.color)}>{trust.score}%</h3>
                    </div>
                    {isMounted && (
                      <div className="h-[180px] w-full">
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

                  <Card className="bg-sky-500 text-white border-none p-10 rounded-[3rem] shadow-2xl shadow-sky-200 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-20"><Sparkles className="h-12 w-12" /></div>
                    <h3 className="text-3xl font-headline font-black tracking-tight mb-4 leading-tight">Neural Matcher.</h3>
                    <p className="text-sky-50 font-medium text-sm leading-relaxed mb-8 opacity-80">Synchronizing available residency nodes with your identity velocity.</p>
                    <Button variant="outline" className="w-full h-16 rounded-2xl bg-white/20 border-white/40 text-white font-black hover:bg-white hover:text-sky-500 transition-all shadow-xl text-lg" asChild>
                      <Link href="/search">Establish Sync</Link>
                    </Button>
                  </Card>
                </div>

                <div className="space-y-16">
                  <ActionSection title="Core Infrastructure Actions">
                    <ActionButton icon={Search} label="Search Nodes" onClick={() => router.push("/search")} />
                    <ActionButton icon={Map} label="View on Map" onClick={() => toast({ title: "Neural Map Loading", description: "Spatial data packets syncing..." })} />
                    <ActionButton icon={Filter} label="Filter Logic" onClick={() => router.push("/search")} />
                    <Dialog>
                      <DialogTrigger asChild>
                        <ActionButton icon={Zap} label="M-Pesa STK Now" variant="default" className="premium-gradient text-white border-none shadow-xl shadow-primary/20" />
                      </DialogTrigger>
                      <DialogContent className="rounded-[3rem] glass border-none p-12">
                        <DialogHeader><DialogTitle className="text-3xl font-black">Escrow Lock Protocol</DialogTitle></DialogHeader>
                        <div className="py-10 text-center space-y-6">
                          <div className="h-24 w-24 bg-emerald-500 rounded-[2rem] flex items-center justify-center mx-auto text-white shadow-2xl shadow-emerald-200">
                            <ShieldCheck className="h-12 w-12" />
                          </div>
                          <p className="font-medium text-slate-600">Transmit M-Pesa STK Push to synchronize deposit node.</p>
                          <Button onClick={handleMpesaSTK} disabled={isProcessingSTK} className="w-full h-16 rounded-2xl premium-gradient font-black text-lg">
                            {isProcessingSTK ? <Loader2 className="animate-spin" /> : "Initiate Handset Sync"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <ActionButton icon={Heart} label="Saved Nodes" onClick={() => setActiveTab("wishlist")} />
                    <ActionButton icon={ArrowLeftRight} label="Compare Specs" />
                    <ActionButton icon={Share2} label="Broadcast Node" />
                  </ActionSection>

                  <ActionSection title="My Residency (Active Lease)">
                    <ActionButton icon={FileText} label="View Lease" />
                    <ActionButton icon={Download} label="Download PDF" />
                    <ActionButton icon={Wrench} label="Report Issue" />
                    <ActionButton icon={Plus} label="New Request" />
                    <ActionButton icon={MessageSquare} label="Suggestion" />
                    <ActionButton icon={MessageCircle} label="Direct Chat" />
                    <ActionButton icon={History} label="History Log" />
                    <ActionButton icon={CreditCard} label="Pay Rent" variant="default" className="bg-slate-900 text-white border-none" />
                    <ActionButton icon={RefreshCcw} label="Renewal Sync" />
                    <ActionButton icon={LeaveIcon} label="Vacate Notice" className="text-rose-500 hover:text-rose-600 hover:bg-rose-50" />
                  </ActionSection>

                  <ActionSection title="Bookings & Financials">
                    <ActionButton icon={Eye} label="Sync Status" />
                    <ActionButton icon={Ticket} label="Cancel Node" />
                    <ActionButton icon={History} label="Audit Trail" />
                    <ActionButton icon={Receipt} label="Last Receipt" />
                    <ActionButton icon={FileText} label="Open Invoice" />
                  </ActionSection>

                  <ActionSection title="Identity & Protocols">
                    <ActionButton icon={UserCircle} label="Edit Profile" />
                    <ActionButton icon={Key} label="Ciphers" />
                    <ActionButton icon={Shield} label="Enable 2FA" className="text-emerald-600" />
                    <ActionButton icon={Settings} label="Global Config" />
                    <div className="flex gap-2">
                      <ActionButton icon={Sun} label="Light" className="flex-1" />
                      <ActionButton icon={Moon} label="Dark" className="flex-1 bg-slate-900 text-white border-none" />
                    </div>
                  </ActionSection>

                  <ActionSection title="Premium Intelligence Features">
                    <ActionButton icon={UserPlus} label="Find Roommate" />
                    <ActionButton icon={Calculator} label="Budget Logic" />
                    <ActionButton icon={Star} label="Rate Asset" />
                    <ActionButton icon={MessageSquare} label="Submit Review" />
                    <ActionButton icon={MapPin} label="Nearby Nodes" />
                    <ActionButton icon={PhoneCall} label="Emergency Link" className="bg-rose-500 text-white border-none" />
                    <ActionButton icon={HelpCircle} label="Authority Help" />
                  </ActionSection>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </SidebarProvider>
  );
}
