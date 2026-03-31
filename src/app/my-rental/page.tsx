"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useUser, useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, where, serverTimestamp, doc } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Wrench, MessageSquare, AlertCircle, CheckCircle2, ShieldCheck, CreditCard, Home, Send, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function MyRentalPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ title: "", description: "" });

  const activeLeaseQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "bookings"), where("tenantId", "==", user.uid), where("status", "==", "Active"));
  }, [db, user]);

  const { data: leases, isLoading: isLeaseLoading } = useCollection(activeLeaseQuery);
  const activeLease = leases?.[0];

  const maintenanceQuery = useMemoFirebase(() => {
    if (!db || !user) return null;
    return query(collection(db, "maintenanceRequests"), where("tenantId", "==", user.uid));
  }, [db, user]);

  const { data: requests } = useCollection(maintenanceQuery);

  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user || !activeLease) return;

    addDocumentNonBlocking(collection(db, "maintenanceRequests"), {
      tenantId: user.uid,
      propertyId: activeLease.propertyId,
      landlordId: activeLease.landlordId,
      title: issueForm.title,
      description: issueForm.description,
      status: "Open",
      createdAt: serverTimestamp(),
    });

    toast({ title: "Issue Logged", description: "Node deficiency transmitted to host." });
    setIsIssueModalOpen(false);
    setIssueForm({ title: "", description: "" });
  };

  if (isUserLoading || isLeaseLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-20 max-w-6xl text-foreground">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <Badge className="bg-primary/10 text-primary border-none px-4 py-1 rounded-full font-black text-[10px] uppercase tracking-widest">Resident Hub</Badge>
            <h1 className="text-5xl font-headline font-black tracking-tighter text-slate-900">My Residency.</h1>
          </div>
          <div className="flex gap-4">
            <Dialog open={isIssueModalOpen} onOpenChange={setIsIssueModalOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full h-14 px-8 premium-gradient text-white font-black shadow-xl shadow-primary/20 gap-2">
                  <Wrench className="h-5 w-5" /> Report Deficiency
                </Button>
              </DialogTrigger>
              <DialogContent className="rounded-[3rem] glass border-none p-12 text-foreground">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-black">Log Operational Ticket</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmitIssue} className="space-y-6 pt-4">
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-slate-400">Node Component</Label>
                    <Input placeholder="e.g., HVAC System" value={issueForm.title} onChange={e => setIssueForm({...issueForm, title: e.target.value})} required className="h-12 rounded-xl bg-slate-50 border-none px-6" />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-black uppercase text-[10px] text-slate-400">Failure Logic</Label>
                    <Textarea placeholder="Details..." value={issueForm.description} onChange={e => setIssueForm({...issueForm, description: e.target.value})} required className="min-h-[120px] rounded-xl bg-slate-50 border-none px-6 py-4" />
                  </div>
                  <Button type="submit" className="w-full h-14 rounded-2xl bg-primary text-white font-black">Transmit Protocol</Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" className="rounded-full h-14 px-8 border-2 border-slate-200 font-black gap-2">
              <Send className="h-5 w-5" /> Submit Suggestion
            </Button>
          </div>
        </header>

        {!activeLease ? (
          <Card className="p-24 text-center glass border-dashed rounded-[4rem] border-slate-200">
            <Home className="h-20 w-20 text-slate-200 mx-auto mb-8 opacity-20" />
            <h2 className="text-3xl font-black text-slate-400 tracking-tight">No Active Residency Node.</h2>
            <p className="text-slate-400 mt-2 font-medium">Browse the intelligence catalog to synchronize a new home.</p>
            <Button className="mt-8 rounded-full px-10 h-14 premium-gradient font-black shadow-xl shadow-primary/20" asChild><Link href="/search">Explore Catalog</Link></Button>
          </Card>
        ) : (
          <div className="grid lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-12">
              <Card className="bg-white border-none p-10 rounded-[3rem] shadow-xl shadow-slate-900/5">
                <div className="flex justify-between items-start mb-10">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Occupied Node</p>
                    <h3 className="text-3xl font-headline font-black tracking-tight">Active Lease #{activeLease.id.slice(0,8)}</h3>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border-none px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest">CONNECTED</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                  {[
                    { label: "Escrow Status", val: "Held", icon: <ShieldCheck className="h-5 w-5 text-emerald-500" /> },
                    { label: "Next Payment", val: "Oct 1st", icon: <CreditCard className="h-5 w-5 text-primary" /> },
                    { label: "Unit ID", val: activeLease.unitId || "N/A", icon: <Zap className="h-5 w-5 text-amber-500" /> },
                    { label: "Trust Delta", val: "+4.2%", icon: <AlertCircle className="h-5 w-5 text-sky-500" /> }
                  ].map((stat, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center gap-2">
                        {stat.icon}
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                      </div>
                      <p className="text-xl font-black text-slate-900">{stat.val}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <Wrench className="h-6 w-6 text-primary" /> Operational History
                  </h3>
                  <Badge variant="outline" className="rounded-full px-4">{requests?.length || 0} Tickets</Badge>
                </div>
                <div className="grid gap-6">
                  {requests?.length ? requests.map(req => (
                    <Card key={req.id} className="bg-white border-none p-8 rounded-[2.5rem] shadow-sm flex justify-between items-center group hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
                      <div className="space-y-1">
                        <h4 className="text-lg font-black text-slate-900">{req.title}</h4>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-md">{req.description}</p>
                      </div>
                      <Badge className={cn("rounded-full font-black text-[10px] px-4 py-1.5 border-none", 
                        req.status === 'Open' ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600")}>
                        {req.status.toUpperCase()}
                      </Badge>
                    </Card>
                  )) : (
                    <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                      <CheckCircle2 className="h-10 w-10 text-slate-100 mx-auto mb-4" />
                      <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No Node Deficiencies Logged</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-12">
              <Card className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><MessageSquare className="h-32 w-32" /></div>
                <div className="relative z-10 space-y-6">
                  <h3 className="text-2xl font-black tracking-tight">Direct Host Sync</h3>
                  <p className="text-slate-400 text-sm leading-relaxed font-medium">Establish an encrypted communication channel with the property administrator node.</p>
                  <Button className="w-full h-14 rounded-2xl bg-white text-slate-900 font-black hover:bg-slate-100 transition-all shadow-xl">Initiate Chat</Button>
                </div>
              </Card>

              <Card className="bg-white border-none p-10 rounded-[3rem] shadow-xl shadow-slate-900/5">
                <h3 className="text-xl font-black tracking-tight mb-6">Payment Hub</h3>
                <div className="space-y-4">
                  <Button variant="outline" className="w-full h-16 rounded-xl border-2 border-slate-100 flex justify-between items-center px-6 group hover:border-primary transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center"><Zap className="h-4 w-4 text-emerald-500" /></div>
                      <span className="font-black text-[10px] uppercase tracking-widest">M-Pesa STK Push</span>
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-600 group-hover:bg-primary group-hover:text-white border-none text-[9px] font-black">ACTIVE</Badge>
                  </Button>
                  <Button variant="outline" className="w-full h-16 rounded-xl border-2 border-slate-100 flex justify-between items-center px-6 group hover:border-primary transition-all">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center"><CreditCard className="h-4 w-4 text-slate-400" /></div>
                      <span className="font-black text-[10px] uppercase tracking-widest">Card Telemetry</span>
                    </div>
                    <Badge className="bg-slate-100 text-slate-400 border-none text-[9px] font-black">SETUP</Badge>
                  </Button>
                </div>
              </Card>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}