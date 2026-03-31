"use client";

import { useState, useEffect, useMemo } from "react";
import { AreaChart, Area, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { 
  Building2, Plus, Loader2, LogOut, Sparkles, MapPin, Layers, 
  UserCircle, Settings, CheckCircle2, TrendingUp, 
  Trash2, Edit3, MessageSquare, Zap, Bell, Briefcase, Users, LayoutDashboard, 
  Search, Activity, Upload, ShieldCheck, Clock, Info, ArrowLeft, MoreHorizontal, ShieldAlert
} from "lucide-react";
import { 
  useUser, useFirestore, useCollection, useMemoFirebase, useAuth, useDoc
} from "@/firebase";
import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, 
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger 
} from "@/components/ui/sidebar";
import { collection, query, where, serverTimestamp, doc, updateDoc, orderBy, limit, addDoc } from "firebase/firestore";
import { addDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { signOut } from "firebase/auth";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ChartContainer } from "@/components/ui/chart";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { NotificationBell } from "@/components/notifications/notification-bell";

export default function AgentDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [isMounted, setIsMounted] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Unit management states
  const [isAddingUnit, setIsAddingUnit] = useState(false);
  const [isBulkAdding, setIsBulkAdding] = useState(false);
  const [unitForm, setUnitForm] = useState({ 
    unitNumber: "", type: "Studio", price: "", floor: "1", status: "Vacant"
  });
  const [bulkForm, setBulkForm] = useState({
    startNum: 1, endNum: 10, type: "Studio", price: "", floor: "1"
  });

  const [propForm, setPropForm] = useState({ 
    title: "", location: "", rent: "", description: "", category: "Residential",
    propertyType: "Single Unit", buildingImg: "", videoUrl: ""
  });

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

  const isAgent = profile && (profile.role === "Agent" || profile.role === "Admin");
  const isVerified = profile?.isVerified === true;

  const propertiesQuery = useMemoFirebase(() => 
    (db && user && isAgent && isVerified) ? query(collection(db, "properties"), where("agentId", "==", user.uid)) : null, 
    [db, user, isAgent, isVerified]
  );
  const { data: properties } = useCollection(propertiesQuery);

  const bookingsQuery = useMemoFirebase(() => 
    (db && user && isAgent && isVerified) ? query(collection(db, "bookings"), where("agentId", "==", user.uid)) : null, 
    [db, user, isAgent, isVerified]
  );
  const { data: bookings } = useCollection(bookingsQuery);

  const unitsQuery = useMemoFirebase(() => 
    (db && selectedPropertyId && isVerified) ? collection(db, "properties", selectedPropertyId, "units") : null,
    [db, selectedPropertyId, isVerified]
  );
  const { data: units } = useCollection(unitsQuery);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPropForm(prev => ({ ...prev, [field]: reader.result as string }));
      toast({ title: "Media Protocol Synced" });
    };
    reader.readAsDataURL(file);
  };

  const handleDeployProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !isVerified) return;
    setIsDeploying(true);
    try {
      const propRef = await addDoc(collection(db, "properties"), {
        agentId: user.uid,
        landlordId: user.uid, 
        title: propForm.title,
        location: propForm.location,
        monthlyRent: Number(propForm.rent),
        description: propForm.description,
        category: propForm.category || "Residential",
        propertyType: propForm.propertyType,
        isAvailable: true,
        isVerified: false,
        createdAt: serverTimestamp(),
        imageUrl: propForm.buildingImg || null,
        videoUrl: propForm.videoUrl || null
      });
      toast({ title: "Asset Deployed", description: "Identity node projected into catalog." });
      
      if (propForm.propertyType === 'Single Unit') {
        const unitsRef = collection(db, "properties", propRef.id, "units");
        addDocumentNonBlocking(unitsRef, {
          unitNumber: "101",
          floor: 1,
          type: "Studio",
          price: Number(propForm.rent),
          status: "Vacant",
          amenities: []
        });
      }

      setPropForm({ title: "", location: "", rent: "", description: "", category: "Residential", propertyType: "Single Unit", buildingImg: "", videoUrl: "" });
    } finally { setIsDeploying(false); }
  };

  const handleAddSingleUnit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedPropertyId) return;
    const unitsRef = collection(db, "properties", selectedPropertyId, "units");
    addDocumentNonBlocking(unitsRef, {
      ...unitForm,
      price: Number(unitForm.price),
      floor: Number(unitForm.floor)
    });
    toast({ title: "Unit Synced" });
    setIsAddingUnit(false);
    setUnitForm({ unitNumber: "", type: "Studio", price: "", floor: "1", status: "Vacant" });
  };

  const handleBulkAddUnits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !selectedPropertyId) return;
    const unitsRef = collection(db, "properties", selectedPropertyId, "units");
    for (let i = bulkForm.startNum; i <= bulkForm.endNum; i++) {
      addDocumentNonBlocking(unitsRef, {
        unitNumber: `${bulkForm.floor}${i.toString().padStart(2, '0')}`,
        type: bulkForm.type,
        price: Number(bulkForm.price),
        floor: Number(bulkForm.floor),
        status: "Vacant",
        amenities: []
      });
    }
    toast({ title: "Neural Bulk Sync Complete" });
    setIsBulkAdding(false);
  };

  if (isUserLoading || (user && !profile)) {
    return <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6 text-foreground text-foreground">
      <Loader2 className="animate-spin h-12 w-12 text-primary" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Identity Sync</p>
    </div>;
  }

  if (!user || !isAgent) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-sky-50/30 flex w-full">
        <Sidebar className="border-r border-slate-200/60 glass" collapsible="icon">
          <SidebarHeader className="p-8">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
              <div className="bg-primary p-2.5 rounded-2xl shadow-lg">
                <Briefcase className="text-white h-5 w-5" />
              </div>
              <span className="font-headline font-black text-xl tracking-tighter text-primary group-data-[collapsible=icon]:hidden">Agency Node</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4 text-foreground text-foreground">
            <SidebarMenu className="space-y-1 text-foreground">
              {[
                { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
                { id: 'properties', label: 'Properties', icon: <Building2 className="h-4 w-4" /> },
                { id: 'clients', label: 'Clients', icon: <Users className="h-4 w-4" /> },
                { id: 'bookings', label: 'Bookings', icon: <CheckCircle2 className="h-4 w-4" /> },
                { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
              ].map(item => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    isActive={activeTab === item.id} 
                    disabled={!isVerified && item.id !== 'settings'}
                    onClick={() => { setActiveTab(item.id); setSelectedPropertyId(null); }} 
                    className={cn(
                      "h-12 rounded-xl font-bold uppercase text-[10px] tracking-[0.1em] transition-all duration-300",
                      activeTab === item.id ? "bg-primary text-white shadow-xl scale-[1.02]" : "hover:bg-slate-100 text-slate-500",
                      !isVerified && item.id !== 'settings' && "opacity-20 grayscale"
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
              <LogOut className="h-4 w-4 mr-3" /> <span className="group-data-[collapsible=icon]:hidden">End Sync</span>
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 flex flex-col min-w-0 text-foreground">
          <header className="h-24 glass border-b border-slate-200/60 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50 text-foreground">
            <div className="flex items-center gap-4 md:gap-8 flex-1 text-foreground">
              <SidebarTrigger className="p-2 bg-slate-100 text-primary rounded-full hover:bg-primary/10 transition-colors" />
              <div className="relative max-w-md w-full hidden md:block text-foreground">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input placeholder="Search platform matrix..." className="pl-12 h-12 bg-slate-50/50 border-none rounded-2xl focus-visible:ring-primary/20 text-foreground text-foreground" />
              </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6 text-foreground">
              <NotificationBell />
              <div 
                className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                onClick={() => setIsProfileOpen(true)}
              >
                {profile?.photoUrl ? (
                  <img src={profile.photoUrl} className="h-full w-full object-cover" />
                ) : <UserCircle className="h-7 w-7 text-primary" />}
              </div>
            </div>
          </header>

          <main className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar text-foreground text-foreground">
            {!isVerified ? (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex items-center justify-center">
                <Card className="max-w-2xl w-full bg-white border-none p-16 rounded-[4rem] shadow-2xl text-center space-y-8 relative overflow-hidden text-foreground text-foreground text-foreground">
                  <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12"><ShieldAlert className="h-40 w-40 text-primary" /></div>
                  <div className="h-24 w-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary shadow-xl border border-primary/10">
                    <Clock className="h-12 w-12 animate-pulse" />
                  </div>
                  <div className="space-y-4 relative z-10 text-foreground">
                    <h2 className="text-4xl font-headline font-black tracking-tight text-slate-900 leading-tight">Identity Node Locked.</h2>
                    <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-md mx-auto">
                      Your Agent credentials are being verified by the platform authority. Functional matrix access is pending.
                    </p>
                  </div>
                  <div className="flex flex-col gap-4 pt-6 relative z-10 text-foreground">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex items-center gap-4 text-left">
                      <div className="p-2 bg-white rounded-xl shadow-sm"><Info className="h-5 w-5 text-primary" /></div>
                      <p className="text-xs font-bold text-slate-600 leading-relaxed uppercase tracking-widest">Typical verification node: 4-12 Cycles</p>
                    </div>
                    <Button variant="ghost" className="h-14 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400" onClick={() => signOut(auth)}>End Protocol</Button>
                  </div>
                </Card>
              </motion.div>
            ) : (
              <AnimatePresence mode="wait">
                {!selectedPropertyId ? (
                  <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="container mx-auto space-y-12">
                    {activeTab === 'overview' && (
                      <div className="space-y-12 text-foreground">
                        <header className="space-y-2">
                          <h1 className="text-4xl md:text-5xl font-headline font-black tracking-tighter text-slate-900">Agency Telemetry.</h1>
                          <p className="text-sm text-slate-400 font-medium">Real-time matching velocity logs.</p>
                        </header>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 text-foreground">
                          {[
                            { label: "Assets", val: properties?.length || 0, icon: <Building2 className="h-4 w-4" />, color: "text-primary", bg: "bg-primary/5" },
                            { label: "Active Leads", val: "842", icon: <Zap className="h-4 w-4" />, color: "text-amber-500", bg: "bg-amber-50" },
                            { label: "Sync Delta", val: "12.4%", icon: <TrendingUp className="h-4 w-4" />, color: "text-emerald-500", bg: "bg-emerald-50" },
                            { label: "Managed Clients", val: bookings?.length || 0, icon: <Users className="h-4 w-4" />, color: "text-indigo-500", bg: "bg-indigo-50" }
                          ].map((stat, i) => (
                            <Card key={i} className="p-8 bg-white border-none rounded-[2.5rem] shadow-xl shadow-slate-900/5 group relative overflow-hidden text-foreground">
                              <div className={cn("absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 rotate-12", stat.color)}>{stat.icon}</div>
                              <div className="flex justify-between items-start mb-6 text-foreground">
                                <div className={cn("p-3 rounded-2xl", stat.bg, stat.color)}>{stat.icon}</div>
                              </div>
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                              <h3 className="text-3xl md:text-4xl font-headline font-black tracking-tighter mt-2">{stat.val}</h3>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeTab === 'properties' && (
                      <div className="space-y-12 text-foreground">
                        <h2 className="text-4xl font-headline font-black tracking-tighter text-slate-900">Asset Catalog.</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-foreground text-foreground">
                          {properties?.map(p => (
                            <Card key={p.id} className="bg-white border-none p-8 rounded-[3rem] shadow-xl shadow-slate-900/5 group hover:scale-[1.03] transition-all relative overflow-hidden text-foreground">
                              <div className="relative aspect-[16/10] rounded-[2rem] overflow-hidden mb-8 text-foreground" onClick={() => setSelectedPropertyId(p.id)}>
                                <img src={p.imageUrl || `/placeholder-property.jpg`} className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700" alt="" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                   <Button className="rounded-full h-12 px-8 bg-white text-slate-900 font-black gap-2"><Settings className="h-4 w-4" /> Manage Units</Button>
                                </div>
                              </div>
                              <div className="space-y-6 text-foreground text-foreground text-foreground">
                                <h3 className="text-2xl font-headline font-black tracking-tight text-foreground">{p.title}</h3>
                                <div className="flex items-center gap-2 text-slate-400 text-[10px] font-black uppercase tracking-widest text-foreground"><MapPin className="h-4 w-4" /> {p.location}</div>
                                <div className="flex gap-2 border-t border-slate-50 pt-6">
                                  <Button variant="ghost" size="sm" className="rounded-xl bg-slate-50 text-slate-600 flex-1 h-12 font-black"><Edit3 className="h-4 w-4 mr-2" /> EDIT</Button>
                                  <Button variant="ghost" size="icon" className="rounded-xl bg-rose-50 text-rose-500 h-12 w-12" onClick={() => deleteDocumentNonBlocking(doc(db!, "properties", p.id))}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12 text-foreground">
                     <div className="flex items-center justify-between text-foreground">
                       <Button variant="ghost" className="rounded-full font-black text-[10px] uppercase gap-2 text-foreground" onClick={() => setSelectedPropertyId(null)}>
                         <ArrowLeft className="h-4 w-4" /> Back to Matrix
                       </Button>
                       <div className="flex gap-4 text-foreground text-foreground text-foreground">
                          <Dialog open={isBulkAdding} onOpenChange={setIsBulkAdding}>
                            <DialogTrigger asChild><Button variant="outline" className="rounded-full h-12 px-6 border-2 border-slate-100 font-black gap-2 text-foreground"><Layers className="h-4 w-4" /> Bulk Sync</Button></DialogTrigger>
                            <DialogContent className="rounded-[3rem] p-10 glass border-none max-w-xl text-foreground">
                              <DialogHeader><DialogTitle className="text-3xl font-black">Neural Bulk Sync</DialogTitle></DialogHeader>
                              <form onSubmit={handleBulkAddUnits} className="space-y-8 pt-6 text-foreground text-foreground">
                                <div className="grid grid-cols-2 gap-6 text-foreground text-foreground">
                                  <div className="space-y-2 text-foreground"><Label className="text-[10px] font-black uppercase text-slate-400">Floor</Label><Input type="number" value={bulkForm.floor} onChange={e => setBulkForm({...bulkForm, floor: e.target.value})} required className="h-12 rounded-xl bg-slate-50 border-none px-6 text-foreground" /></div>
                                  <div className="space-y-2 text-foreground text-foreground"><Label className="text-[10px] font-black uppercase text-slate-400">Unit Type</Label><Select value={bulkForm.type} onValueChange={v => setBulkForm({...bulkForm, type: v})}><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none px-6 text-foreground"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Studio">Studio</SelectItem><SelectItem value="1BR">1BR</SelectItem><SelectItem value="2BR">2BR</SelectItem></SelectContent></Select></div>
                                </div>
                                <div className="grid grid-cols-2 gap-6 text-foreground">
                                  <div className="space-y-2 text-foreground"><Label className="text-[10px] font-black uppercase text-slate-400">Start Range</Label><Input type="number" value={bulkForm.startNum} onChange={e => setBulkForm({...bulkForm, startNum: Number(e.target.value)})} required className="h-12 rounded-xl bg-slate-50 border-none px-6 text-foreground" /></div>
                                  <div className="space-y-2 text-foreground"><Label className="text-[10px] font-black uppercase text-slate-400">End Range</Label><Input type="number" value={bulkForm.endNum} onChange={e => setBulkForm({...bulkForm, endNum: Number(e.target.value)})} required className="h-12 rounded-xl bg-slate-50 border-none px-6 text-foreground" /></div>
                                </div>
                                <div className="space-y-2 text-foreground text-foreground"><Label className="text-[10px] font-black uppercase text-slate-400">Yield Price (KES)</Label><Input type="number" value={bulkForm.price} onChange={e => setBulkForm({...bulkForm, price: e.target.value})} required className="h-12 rounded-xl bg-slate-50 border-none px-6 text-foreground" /></div>
                                <Button type="submit" className="w-full h-16 rounded-2xl bg-primary text-white font-black">Execute Batch Sync</Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={isAddingUnit} onOpenChange={setIsAddingUnit}>
                            <DialogTrigger asChild><Button className="rounded-full h-12 px-8 bg-primary text-white font-black gap-2 text-foreground"><Plus className="h-4 w-4" /> Add Unit Node</Button></DialogTrigger>
                            <DialogContent className="rounded-[3rem] p-10 glass border-none max-w-xl text-foreground">
                              <DialogHeader><DialogTitle className="text-3xl font-black">Manual Unit Sync</DialogTitle></DialogHeader>
                              <form onSubmit={handleAddSingleUnit} className="space-y-6 pt-6 text-foreground text-foreground">
                                <div className="grid grid-cols-2 gap-6 text-foreground">
                                  <div className="space-y-2 text-foreground text-foreground"><Label className="text-[10px] font-black uppercase text-slate-400">Unit ID</Label><Input value={unitForm.unitNumber} onChange={e => setUnitForm({...unitForm, unitNumber: e.target.value})} required className="h-12 rounded-xl bg-slate-50 border-none px-6 text-foreground" /></div>
                                  <div className="space-y-2 text-foreground text-foreground"><Label className="text-[10px] font-black uppercase text-slate-400">Floor</Label><Input type="number" value={unitForm.floor} onChange={e => setUnitForm({...unitForm, floor: e.target.value})} required className="h-12 rounded-xl bg-slate-50 border-none px-6 text-foreground" /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-6 text-foreground text-foreground">
                                  <div className="space-y-2 text-foreground text-foreground"><Label className="text-[10px] font-black uppercase text-slate-400">Type</Label><Select value={unitForm.type} onValueChange={v => setUnitForm({...unitForm, type: v})}><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none px-6 text-foreground"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Studio">Studio</SelectItem><SelectItem value="1BR">1BR</SelectItem><SelectItem value="2BR">2BR</SelectItem></SelectContent></Select></div>
                                  <div className="space-y-2 text-foreground text-foreground"><Label className="text-[10px] font-black uppercase text-slate-400">Rent (KES)</Label><Input type="number" value={unitForm.price} onChange={e => setUnitForm({...unitForm, price: e.target.value})} required className="h-12 rounded-xl bg-slate-50 border-none px-6 text-foreground" /></div>
                                </div>
                                <Button type="submit" className="w-full h-16 rounded-2xl bg-primary text-white font-black">Sync Unit</Button>
                              </form>
                            </DialogContent>
                          </Dialog>
                       </div>
                     </div>

                     <div className="space-y-6 text-foreground text-foreground text-foreground">
                        <h2 className="text-4xl font-headline font-black tracking-tight text-slate-900">Unit Inventory Matrix</h2>
                        <Card className="rounded-[3rem] bg-white border-none shadow-xl overflow-hidden text-foreground">
                          <Table>
                            <TableHeader className="bg-slate-50/50 text-foreground">
                              <TableRow className="border-none h-14 text-foreground">
                                <TableHead className="px-8 font-black uppercase text-[10px]">Node ID</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Tier</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Floor</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Yield</TableHead>
                                <TableHead className="font-black uppercase text-[10px]">Status</TableHead>
                                <TableHead className="px-8 text-right font-black uppercase text-[10px]">Protocol</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {units?.sort((a,b) => a.unitNumber.localeCompare(b.unitNumber)).map(u => (
                                <TableRow key={u.id} className="h-20 border-slate-50 hover:bg-slate-50 transition-colors text-foreground">
                                  <TableCell className="px-8 font-black text-slate-900">{u.unitNumber}</TableCell>
                                  <TableCell className="font-bold text-slate-500">{u.type}</TableCell>
                                  <TableCell className="font-medium text-slate-400">L{u.floor}</TableCell>
                                  <TableCell className="font-black text-primary">KES {u.price?.toLocaleString()}</TableCell>
                                  <TableCell>
                                    <Badge className={cn("rounded-full border-none px-4 py-1 text-[9px] font-black uppercase tracking-widest", 
                                      u.status === 'Vacant' ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400")}>
                                      {u.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="px-8 text-right text-foreground text-foreground">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full text-foreground"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="rounded-2xl p-2 glass border-none shadow-2xl w-48 text-foreground">
                                        <DropdownMenuItem className="rounded-xl h-11 font-black text-[10px] uppercase gap-3 text-emerald-600"><CheckCircle2 className="h-4 w-4" /> SET VACANT</DropdownMenuItem>
                                        <DropdownMenuItem className="rounded-xl h-11 font-black text-[10px] uppercase gap-3 text-rose-500" onClick={() => deleteDocumentNonBlocking(doc(db!, "properties", selectedPropertyId, "units", u.id))}><Trash2 className="h-4 w-4" /> PURGE NODE</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </Card>
                     </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </main>

          {isVerified && (
            <Dialog>
              <DialogTrigger asChild>
                <button className="fixed bottom-12 right-12 h-20 w-20 rounded-[2.5rem] premium-gradient text-white shadow-2xl flex items-center justify-center group hover:scale-110 transition-all duration-500 z-[100]">
                  <Plus className="h-8 w-8 group-hover:rotate-90 transition-transform duration-500" />
                </button>
              </DialogTrigger>
              <DialogContent className="rounded-[3rem] p-12 glass border-none max-w-4xl overflow-y-auto max-h-[90vh] text-foreground shadow-2xl text-foreground text-foreground">
                <DialogHeader><DialogTitle className="text-4xl font-black text-foreground">New Asset Sync</DialogTitle></DialogHeader>
                <form onSubmit={handleDeployProperty} className="space-y-12 pt-10 text-foreground text-foreground text-foreground">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-foreground">
                    <div className="space-y-8 text-foreground text-foreground">
                      <div className="space-y-2 text-foreground">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Node Title</Label>
                        <Input value={propForm.title} onChange={e => setPropForm({...propForm, title: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-foreground text-foreground" required />
                      </div>
                      <div className="grid grid-cols-2 gap-6 text-foreground">
                        <div className="space-y-2 text-foreground text-foreground"><Label className="text-[10px] font-black uppercase text-slate-400">Rent (KES)</Label><Input type="number" value={propForm.rent} onChange={e => setPropForm({...propForm, rent: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-foreground text-foreground" required /></div>
                        <div className="space-y-2 text-foreground text-foreground text-foreground"><Label className="text-[10px] font-black uppercase text-slate-400">Type</Label><Select value={propForm.propertyType} onValueChange={v => setPropForm({...propForm, propertyType: v})}><SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-foreground text-foreground text-foreground text-foreground"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Single Unit">Single Unit</SelectItem><SelectItem value="Multi-Unit Building">Building Node</SelectItem></SelectContent></Select></div>
                      </div>
                      <div className="space-y-2 text-foreground text-foreground text-foreground">
                        <Label className="text-[10px] font-black uppercase text-slate-400">Location Node</Label>
                        <Input value={propForm.location} onChange={e => setPropForm({...propForm, location: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-foreground text-foreground" required />
                      </div>
                    </div>
                    <div className="space-y-8 text-foreground text-foreground">
                      <Label className="text-[10px] font-black uppercase text-slate-400">Visual Telemetry</Label>
                      <Label htmlFor="agent-building-img" className="flex flex-col items-center justify-center aspect-video rounded-3xl bg-slate-50 border-2 border-dashed border-slate-200 cursor-pointer overflow-hidden text-foreground text-foreground">
                        {propForm.buildingImg ? <img src={propForm.buildingImg} className="h-full w-full object-cover" /> : <Upload className="h-6 w-6 text-slate-300" />}
                        <input type="file" id="agent-building-img" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'buildingImg')} />
                      </Label>
                    </div>
                  </div>
                  <Button type="submit" disabled={isDeploying} className="w-full h-20 rounded-[2rem] premium-gradient text-white font-black text-xl shadow-2xl">Broadcast Asset</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
      <ProfileSettings open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </SidebarProvider>
  );
}