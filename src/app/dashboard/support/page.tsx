"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  AreaChart, Area, CartesianGrid, XAxis, YAxis
} from "recharts";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { 
  Wrench, AlertCircle, LayoutDashboard, CheckCircle2, MessageSquare, 
  Loader2, LogOut, Filter, Activity, Search, Bell, Settings, 
  LifeBuoy, Users, Building2, Ticket, BarChart3, TrendingUp, 
  Clock, UserCircle, ChevronRight, MoreHorizontal, ShieldCheck, Zap, Sparkles, Phone
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth, useDoc } from "@/firebase";
import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, 
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger 
} from "@/components/ui/sidebar";
import { collection, query, limit, doc, updateDoc, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, 
  DropdownMenuSeparator, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { NotificationBell } from "@/components/notifications/notification-bell";

export default function SupportDashboard() {
  const [activeTab, setActiveTab] = useState("tickets");
  const [isMounted, setIsMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/");
    }
  }, [user, isUserLoading, router]);

  const userProfileRef = useMemoFirebase(() => (db && user) ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userProfileRef);

  const isSupport = profile && (profile.role === "Support" || profile.role === "Admin");

  // Role-gated query: Strictly wait for isSupport status
  const ticketsQuery = useMemoFirebase(() => 
    (db && user && isSupport) ? query(collection(db, "maintenanceRequests"), limit(100)) : null, 
    [db, user, isSupport]
  );
  const { data: rawTickets, isLoading: isTicketsLoading } = useCollection(ticketsQuery);

  const tickets = useMemo(() => {
    if (!rawTickets) return null;
    return [...rawTickets].sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [rawTickets]);

  const propertiesQuery = useMemoFirebase(() => 
    (db && user && isSupport) ? query(collection(db, "properties"), limit(10)) : null, 
    [db, user, isSupport]
  );
  const { data: properties } = useCollection(propertiesQuery);

  const handleUpdateStatus = async (id: string, status: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, "maintenanceRequests", id), { status });
      toast({ title: "Node Protocol Updated" });
    } catch (e) {
      toast({ variant: "destructive", title: "Transmission Failed" });
    }
  };

  if (isUserLoading || (user && !profile)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6 text-foreground">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Support Sync</p>
      </div>
    );
  }

  if (!user || !isSupport) return null;

  const sidebarItems = [
    { id: 'tickets', label: 'Ticket Logs', icon: <Ticket className="h-4 w-4" /> },
    { id: 'users', label: 'Identity Matrix', icon: <Users className="h-4 w-4" /> },
    { id: 'properties', label: 'Asset Nodes', icon: <Building2 className="h-4 w-4" /> },
    { id: 'maintenance', label: 'Failure Logic', icon: <Wrench className="h-4 w-4" /> },
    { id: 'settings', label: 'System Config', icon: <Settings className="h-4 w-4" /> },
  ];

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50/30 flex w-full text-foreground">
        <Sidebar className="border-r border-slate-200/60 glass text-foreground" collapsible="icon">
          <SidebarHeader className="p-6 text-foreground">
            <div className="flex items-center gap-3 cursor-pointer text-foreground" onClick={() => router.push("/")}>
              <div className="bg-rose-600 p-2.5 rounded-2xl shadow-xl shadow-rose-200 text-foreground">
                <LifeBuoy className="text-white h-5 w-5" />
              </div>
              <span className="font-headline font-black text-xl tracking-tighter text-rose-900 group-data-[collapsible=icon]:hidden">Support Node</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4 text-foreground">
            <SidebarMenu className="space-y-1 text-foreground">
              {sidebarItems.map(item => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={activeTab === item.id} 
                    onClick={() => setActiveTab(item.id)} 
                    className={cn(
                      "h-12 rounded-xl font-bold uppercase text-[10px] tracking-[0.1em] transition-all duration-300",
                      activeTab === item.id ? "bg-rose-600 text-white shadow-xl shadow-rose-200 scale-[1.02]" : "hover:bg-slate-100 text-slate-500"
                    )}
                  >
                    {item.icon} <span className="ml-3 group-data-[collapsible=icon]:hidden">{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-6 border-t border-slate-100/60 text-foreground">
            <Button variant="ghost" className="w-full justify-start text-rose-500 font-black h-12 rounded-xl" onClick={() => signOut(auth)}>
              <LogOut className="h-4 w-4 mr-3" /> <span className="group-data-[collapsible=icon]:hidden">Archive Session</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 text-foreground text-foreground">
          <header className="h-24 glass border-b border-slate-200/60 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50 text-foreground">
            <div className="flex items-center gap-8 flex-1 text-foreground">
              <SidebarTrigger className="p-2 bg-slate-100 text-rose-600 rounded-full hover:bg-rose-50 transition-colors" />
              <div className="relative max-w-md w-full hidden md:block text-foreground">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input placeholder="Query assets..." className="pl-12 h-12 bg-slate-50/50 border-none rounded-2xl focus-visible:ring-rose-600/20 text-foreground" />
              </div>
            </div>

            <div className="flex items-center gap-6 text-foreground text-foreground">
              <div className="hidden lg:flex items-center gap-4 px-6 py-2.5 bg-rose-50 rounded-2xl border border-rose-100 text-foreground">
                <div className="p-1.5 bg-rose-500 rounded-lg text-white"><Clock className="h-4 w-4" /></div>
                <div className="flex flex-col text-foreground">
                  <span className="text-[9px] font-black uppercase text-rose-600">Avg Resolution</span>
                  <span className="text-sm font-black text-rose-700">1.4 HOURS</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-foreground">
                <NotificationBell />
                <div 
                  className="h-12 w-12 rounded-2xl bg-rose-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setIsProfileOpen(true)}
                >
                  {profile?.photoUrl ? (
                    <img src={profile.photoUrl} className="h-full w-full object-cover" />
                  ) : <UserCircle className="h-7 w-7 text-rose-600" />}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-12 overflow-y-auto custom-scrollbar text-foreground">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="container mx-auto space-y-12 text-foreground"
              >
                {activeTab === 'tickets' && (
                  <div className="space-y-12 text-foreground">
                    <header className="space-y-2 text-foreground">
                      <h1 className="text-5xl font-headline font-black tracking-tighter text-slate-900">Authority Oversight.</h1>
                      <p className="text-sm text-slate-400 font-medium tracking-tight text-foreground">Active platform deficiency logs: {tickets?.length || 0}</p>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-foreground">
                      {[
                        { label: "Open Tickets", val: tickets?.filter(t => t.status === 'Open').length || 0, icon: <Ticket className="h-6 w-6" />, color: "text-rose-600", bg: "bg-rose-50" },
                        { label: "Assigned Nodes", val: "12", icon: <Users className="h-6 w-6" />, color: "text-indigo-600", bg: "bg-indigo-50" },
                        { label: "Efficiency", val: "98.2%", icon: <Zap className="h-6 w-6" />, color: "text-amber-600", bg: "bg-amber-50" },
                        { label: "Yield Sat", val: "4.9/5", icon: <TrendingUp className="h-6 w-6" />, color: "text-emerald-600", bg: "bg-emerald-50" }
                      ].map((stat, i) => (
                        <Card key={i} className="p-8 bg-white border-none rounded-[2.5rem] shadow-xl shadow-slate-900/5 group relative overflow-hidden text-foreground">
                          <div className={cn("absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 rotate-12", stat.color)}>{stat.icon}</div>
                          <div className="flex justify-between items-start mb-6 text-foreground">
                            <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>{stat.icon}</div>
                          </div>
                          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                          <h3 className="text-4xl font-headline font-black tracking-tighter mt-2">{stat.val}</h3>
                        </Card>
                      ))}
                    </div>

                    <Card className="bg-white border-none rounded-[3.5rem] overflow-hidden shadow-xl shadow-slate-900/5 text-foreground mt-12 text-foreground">
                      <Table>
                        <TableHeader className="bg-slate-50/50 text-foreground">
                          <TableRow className="border-none h-16 text-foreground">
                            <TableHead className="px-10 font-black uppercase text-[10px]">Deficiency ID</TableHead>
                            <TableHead className="font-black uppercase text-[10px]">Context Node</TableHead>
                            <TableHead className="font-black uppercase text-[10px]">Priority</TableHead>
                            <TableHead className="font-black uppercase text-[10px]">Status</TableHead>
                            <TableHead className="px-10 text-right font-black uppercase text-[10px]">Protocol</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-foreground">
                          {isTicketsLoading ? (
                            <TableRow><TableCell colSpan={5} className="h-60 text-center"><Loader2 className="animate-spin h-12 w-12 mx-auto text-primary" /></TableCell></TableRow>
                          ) : (
                            tickets?.map(t => (
                              <TableRow key={t.id} className="border-slate-50 h-24 hover:bg-slate-50 transition-colors group text-foreground">
                                <TableCell className="px-10 text-foreground">
                                  <div className="text-foreground text-foreground">
                                    <p className="font-black text-lg text-slate-900 line-clamp-1">{t.title}</p>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">UID: {t.id.slice(0,12)}</p>
                                  </div>
                                </TableCell>
                                <TableCell className="text-foreground">
                                  <Badge className="bg-slate-900 text-white rounded-full px-4 text-[9px] uppercase font-black">
                                    {properties?.find(p => p.id === t.propertyId)?.title || 'PROPERTY_NODE'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-foreground">
                                  <Badge className="bg-rose-50 text-rose-600 border-none font-black text-[9px] uppercase">CRITICAL</Badge>
                                </TableCell>
                                <TableCell className="text-foreground">
                                  <div className={cn("flex items-center gap-2 font-black text-[10px] uppercase", t.status === 'Open' ? "text-amber-500" : "text-emerald-500")}>
                                    {t.status}
                                  </div>
                                </TableCell>
                                <TableCell className="px-10 text-right text-foreground">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="icon" className="rounded-full text-slate-600"><MoreHorizontal className="h-4 w-4" /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 glass border-none shadow-2xl text-foreground">
                                      <DropdownMenuItem onClick={() => handleUpdateStatus(t.id, 'Resolved')} className="rounded-xl h-11 font-black text-[10px] uppercase gap-3 text-foreground">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Resolve Node
                                      </DropdownMenuItem>
                                      <DropdownMenuItem className="rounded-xl h-11 font-black text-[10px] uppercase gap-3 text-rose-500">
                                        <AlertCircle className="h-4 w-4" /> Escalate to Admin
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </Card>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
      <ProfileSettings open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </SidebarProvider>
  );
}