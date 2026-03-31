"use client";

import { useState, useEffect } from "react";
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
import { collection, query, where, limit, doc } from "firebase/firestore";
import { getTrustScoreInfo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { signOut } from "firebase/auth";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar as RechartsRadar } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CustomersDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Performance: Immediate redirect on logout to prevent "infinite loading"
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useDoc(userRef);

  const bookingsQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(
      collection(db, "bookings"), 
      where("tenantId", "==", user.uid)
    );
  }, [db, user]);
  
  const { data: rawBookings, isLoading: isBookingsLoading, error: bookingsError } = useCollection(bookingsQuery);

  const bookings = useMemoFirebase(() => {
    if (!rawBookings) return null;
    return [...rawBookings].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [rawBookings]);

  const paymentsQuery = useMemoFirebase(() => 
    (db && user) ? query(collection(db, "bookings"), where("tenantId", "==", user.uid), where("status", "==", "paid"), limit(12)) : null, 
    [db, user]
  );
  const { data: payments, error: paymentsError } = useCollection(paymentsQuery);

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

  const isCustomer = profile?.role === 'Customer' || profile?.role === 'Tenant';\n  const isVerified = profile?.isVerified === true;\n\n  if (!isCustomer) {\n    useEffect(() => {\n      const target = profile?.role === 'Landlord' ? '/dashboard/landlord' :\n                     profile?.role === 'Admin' ? '/dashboard/admin' :\n                     profile?.role === 'Agent' ? '/dashboard/agent' :\n                     profile?.role === 'Student' ? '/dashboard/student' :\n                     '/';\n      router.push(target);\n    }, [profile, router]);\n    return null;\n  }\n\n  if (!isVerified) {\n    return (\n      <div className=\"min-h-screen bg-slate-50/50 flex items-center justify-center p-8\">\n        <Card className=\"max-w-2xl w-full bg-white border-none p-16 rounded-[4rem] shadow-2xl text-center space-y-8 relative overflow-hidden\">\n          <div className=\"absolute top-0 right-0 p-12 opacity-5 rotate-12\"><Clock className=\"h-40 w-40 text-primary\" /></div>\n          <div className=\"h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-xl border border-primary/20\">\n            <Clock className=\"h-12 w-12 animate-pulse\" />\n          </div>\n          <div className=\"space-y-4 relative z-10\">\n            <h2 className=\"text-4xl font-headline font-black tracking-tight text-slate-900 leading-tight\">Verification Pending.</h2>\n            <p className=\"text-lg text-slate-500 font-medium leading-relaxed max-w-md mx-auto\">\n              Your customer identity is under review by NairobiPad authority.\n            </p>\n          </div>\n          <div className=\"flex flex-col gap-4 pt-6 relative z-10\">\n            <div className=\"p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 text-left\">\n              <div className=\"p-2 bg-white rounded-xl shadow-sm\"><HelpCircle className=\"h-5 w-5 text-primary\" /></div>\n              <p className=\"text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-widest\">Estimated: 2-6 hours</p>\n            </div>\n            <Button variant=\"ghost\" className=\"h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400\" onClick={() => signOut(auth)}>End Session</Button>\n          </div>\n        </Card>\n      </div>\n    );\n  }\n\n  if (isUserLoading || isProfileLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6 text-foreground">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Syncing Dashboard</p>
          <p className="text-xs text-muted-foreground font-medium mt-2">Connecting to customer telemetry matrix...</p>
        </div>
      </div>
    );
  }

  const SectionHeading = ({ title }: { title: string }) => (
    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 border-b border-slate-100 pb-2 mb-6">{title}</h3>
  );

  const PremiumActionCard = ({ icon: Icon, title, description, onClick, className }: any) => (
    <Card 
      onClick={onClick}
      className={cn(
        "group cursor-pointer bg-white border-none p-8 rounded-[2.5rem] shadow-xl shadow-slate-900/5 transition-all hover:scale-[1.03] hover:shadow-2xl relative overflow-hidden text-foreground",
        className
      )}
    >
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10">
        <Icon className="h-16 w-16" />
      </div>
      <div className="p-4 bg-slate-50 rounded-2xl w-fit mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="text-xl font-headline font-black text-slate-900 mb-2">{title}</h4>
      <p className="text-sm text-slate-400 font-medium leading-relaxed">{description}</p>
    </Card>
  );

  const StandardActionCard = ({ icon: Icon, label, onClick, variant = "outline" }: any) => (
    <Button 
      variant={variant}
      onClick={onClick || (() => toast({ title: "Module Locked", description: "Protocol initialization in progress." }))}
      className={cn(
        "h-auto py-8 flex-col gap-4 rounded-[2rem] border-2 transition-all hover:scale-[1.02] active:scale-95 group",
        variant === "outline" ? "bg-white border-slate-100 hover:border-primary hover:bg-primary/5" : "premium-gradient border-none shadow-lg"
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
      <div className="min-h-screen bg-slate-50/50 flex w-full">
        <Sidebar className="border-r border-slate-200 glass" collapsible="icon">
          <SidebarHeader className="p-8">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl shadow-lg">
                <LayoutDashboard className="text-white h-5 w-5" />
              </div>
              <span className="font-headline font-black text-xl tracking-tighter text-primary group-data-[collapsible=icon]:hidden">Customers Hub</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4 text-foreground">
            <SidebarMenu className="space-y-1">
              {[
                { id: 'overview', label: 'Command Center', icon: <LayoutDashboard className="h-4 w-4" /> },
                { id: 'rentals', label: 'My Residencies', icon: <Building2 className="h-4 w-4" /> },
                { id: 'financials', label: 'Financial Hub', icon: <CreditCard className="h-4 w-4" /> },
                { id: 'saved', label: 'Saved Nodes', icon: <Heart className="h-4 w-4" /> },
                { id: 'profile', label: 'Identity Node', icon: <UserCircle className="h-4 w-4" /> },
                { id: 'support', label: 'Support Authority', icon: <HelpCircle className="h-4 w-4" /> }
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

        <main className="flex-1 flex flex-col p-8 lg:p-12 overflow-y-auto text-foreground">
          <header className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 gap-8 mb-12">
            <div className="flex items-center gap-6 w-full md:w-auto">
              <SidebarTrigger className="p-3 bg-slate-50 hover:bg-slate-100 text-primary rounded-full transition-colors" />
              <div>
                <h1 className="text-4xl font-headline font-black tracking-tighter text-slate-900">
                  {activeTab === 'overview' && "Command Center."}
                  {activeTab === 'rentals' && "Residency Matrix."}
                  {activeTab === 'financials' && "Financial Hub."}
                  {activeTab === 'saved' && "Saved Nodes."}
                  {activeTab === 'profile' && "Identity Settings."}
                  {activeTab === 'support' && "Platform Authority."}
                </h1>
                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1 text-foreground">Customer node active: {user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="rounded-full h-14 w-14 bg-slate-50 text-slate-600 relative">
                <Bell className="h-6 w-6" />
                <span className="absolute top-4 right-4 h-3 w-3 bg-rose-500 rounded-full border-2 border-white" />
              </Button>
              <Badge className="bg-primary/10 text-primary border-none font-black px-6 py-2.5 rounded-full text-[10px] uppercase tracking-widest">Neural Link Sync</Badge>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <Card className="bg-white border-none p-10 rounded-[3rem] shadow-xl shadow-slate-900/5 relative overflow-hidden group text-foreground">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Wallet className="h-12 w-12 text-primary" /></div>
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">Escrow Value</p>
                    <h3 className="text-5xl font-headline font-black tracking-tighter text-slate-900">KES {bookings?.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0).toLocaleString() || '0'}</h3>
                    <div className="flex items-center gap-2 mt-6"><ShieldCheck className="h-5 w-5 text-emerald-500" /><span className="text-[10px] font-black uppercase text-emerald-500">Escrow Secure</span></div>
                  </Card>
                  
                  <Card className="bg-white border-none p-10 rounded-[3rem] shadow-xl shadow-slate-900/5 text-foreground">
                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-6">Identity Trust</p>
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

                  <Card className="premium-gradient text-white border-none p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-20"><Sparkles className="h-12 w-12" /></div>
                    <h3 className="text-3xl font-headline font-black tracking-tight mb-4 leading-tight">Neural Matcher.</h3>
                    <p className="text-white/70 font-medium text-sm leading-relaxed mb-8">Processing optimal residency nodes for your profile.</p>
                    <Button variant="outline" className="w-full h-16 rounded-2xl bg-white/20 border-white/40 text-white font-black hover:bg-white hover:text-primary transition-all text-lg" asChild>
                      <Link href="/search">Execute Sync</Link>
                    </Button>
                  </Card>
                </div>

                <div className="space-y-8">
                {profileError || bookingsError || paymentsError ? (\n                  <Card className=\"bg-rose-50 border-rose-200 border p-8 rounded-[2rem] text-center\">\n                    <AlertCircle className=\"h-12 w-12 text-rose-500 mx-auto mb-4\" />\n                    <h3 className=\"text-lg font-black text-rose-900 mb-2\">Telemetry Sync Error</h3>\n                    <p className=\"text-rose-700 mb-4\">{(profileError || bookingsError || paymentsError)?.message || 'Permission or data access issue. Contact support.'}</p>\n                    <Button onClick={() => window.location.reload()} className=\"bg-rose-500 hover:bg-rose-600\">Retry Sync</Button>\n                  </Card>\n                ) : (\n                  <>\n                    <SectionHeading title="Recent Activity Nodes" />\n                    {isBookingsLoading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                  ) : bookings && bookings.length > 0 ? (
                    <Card className="bg-white border-none rounded-[2.5rem] overflow-hidden shadow-xl shadow-slate-900/5 text-foreground">
                      <Table>
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="border-none h-14">
                            <TableHead className="px-8 font-black uppercase text-[9px] tracking-widest">Asset Node</TableHead>
                            <TableHead className="font-black uppercase text-[9px] tracking-widest">Value</TableHead>
                            <TableHead className="font-black uppercase text-[9px] tracking-widest">Status</TableHead>
                            <TableHead className="px-8 text-right font-black uppercase text-[9px] tracking-widest">Protocol</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bookings.map(b => (
                            <TableRow key={b.id} className="h-20 border-slate-50 hover:bg-slate-50 transition-colors">
                              <TableCell className="px-8 font-black text-slate-900">{b.propertyTitle || 'Property Node'}</TableCell>
                              <TableCell className="font-bold text-slate-600">KES {b.totalAmount?.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge className={cn("rounded-full px-4 py-1 text-[9px] font-black border-none", 
                                  b.status === 'Paid' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600")}>
                                  {b.status?.toUpperCase()}
                                </Badge>
                              </TableCell>
                              <TableCell className="px-8 text-right">
                                <Button variant="ghost" size="sm" className="rounded-full font-black text-[9px] uppercase" asChild>
                                  <Link href={`/properties/${b.propertyId}`}>Inspect <ChevronRight className="ml-1 h-3 w-3" /></Link>
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Card>
                  ) : (
                    <div className="p-20 text-center glass border-dashed rounded-[3rem] border-slate-200">
                      <Zap className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No active residency locks detected.</p>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  <SectionHeading title="Core Action Matrix" />
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 text-foreground">
                    <PremiumActionCard icon={Search} title="Search Nodes" description="Explore verified property identities." onClick={() => router.push("/search")} />
                    <PremiumActionCard icon={Map} title="Spatial View" description="Visualize residency nodes on map." />
                    <PremiumActionCard icon={Filter} title="Filter Logic" description="Adjust matching parameters." onClick={() => router.push("/search")} />
                    <PremiumActionCard icon={ArrowLeftRight} title="Node Compare" description="Side-by-side asset analytics." />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </SidebarProvider>
  );
}