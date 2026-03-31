"use client";

import { use, useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useDoc, useFirestore, useMemoFirebase, useUser, useCollection } from "@/firebase";
import { doc, serverTimestamp, collection, query } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  MapPin, Loader2, 
  ShieldCheck, Zap, ChevronRight, Phone, Clock, CheckCircle2
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";

export default function PropertyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  const propertyRef = useMemoFirebase(() => (db ? doc(db, "properties", id) : null), [db, id]);
  const { data: property, isLoading } = useDoc(propertyRef);

  const unitsQuery = useMemoFirebase(() => 
    (db && id) ? query(collection(db, "properties", id, "units")) : null,
    [db, id]
  );
  const { data: allUnits } = useCollection(unitsQuery);

  const userProfileRef = useMemoFirebase(() => (db && user) ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userProfileRef);

  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<'CHOICE' | 'PAYMENT' | 'STK_PUSH' | 'SUCCESS'>('CHOICE');
  const [formData, setFormData] = useState({ fullName: "", phone: "" });
  const [isProcessing, setIsProcessing] = useState(false);

  const isGuest = profile?.role === 'Guest';

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;
  }

  if (!property) return null;

  const bookingAmount = selectedUnitId ? (allUnits?.find(u => u.id === selectedUnitId)?.price || property.monthlyRent || 0) : (property.monthlyRent || 0);
  
  // COMMISSION LOGIC: 3% Platform Yield
  const COMMISSION_RATE = 0.03;
  const commissionAmount = bookingAmount * COMMISSION_RATE;
  const netToLandlord = bookingAmount - commissionAmount;

  const executeBookingProtocol = async (payLater: boolean) => {
    if (!user || !db) { router.push("/login"); return; }
    if (isGuest) {
      toast({ title: "Upgrade Identity", description: "Tenant sync required for residency locks." });
      return;
    }

    setIsProcessing(true);
    
    try {
      const bookingsRef = collection(db, "bookings");
      const notificationsRef = collection(db, "notifications");
      
      const bookingData = {
        tenantId: user.uid,
        propertyId: property.id,
        unitId: selectedUnitId || null,
        landlordId: property.landlordId || "system",
        agentId: property.agentId || null,
        propertyTitle: property.title,
        totalAmount: bookingAmount,
        commissionAmount: commissionAmount,
        netAmountToLandlord: netToLandlord,
        status: payLater ? "Reserved" : "Paid",
        createdAt: serverTimestamp(),
        customerName: formData.fullName || profile?.firstName || user.email || "Participant",
        customerPhone: formData.phone || profile?.phone || ""
      };

      await addDocumentNonBlocking(bookingsRef, bookingData);

      // Notify Host
      await addDocumentNonBlocking(notificationsRef, {
        userId: property.landlordId,
        title: "New Residency Sync",
        message: `${bookingData.customerName} has locked ${property.title}. 3% platform fee applied.`,
        type: "booking",
        createdAt: serverTimestamp(),
        isRead: false
      });

      // Notify Tenant
      await addDocumentNonBlocking(notificationsRef, {
        userId: user.uid,
        title: "Sync Confirmed",
        message: `You have successfully locked ${property.title}. Your residency node is active.`,
        type: "booking",
        createdAt: serverTimestamp(),
        isRead: false
      });

      setBookingStep('SUCCESS');
      toast({ title: "Node Synchronized", description: "Identity lock complete." });
    } catch (e) {
      toast({ variant: "destructive", title: "Transmission Failed" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 py-8 pt-40 pb-20">
        <div className="grid lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-16">
            <div className="relative aspect-video rounded-[4rem] overflow-hidden glass p-3 shadow-2xl">
               <Image src={property.imageUrl || `https://picsum.photos/seed/${property.id}/1200/800`} alt={property.title} fill unoptimized className="object-cover rounded-[3.5rem]" />
            </div>
            
            <div className="bg-white p-12 rounded-[4rem] shadow-xl space-y-10 text-foreground">
              <div className="space-y-4">
                <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase px-5 py-2 rounded-full">RESIDENCY NODE</Badge>
                <h1 className="text-4xl md:text-6xl font-headline font-black text-slate-900">{property.title}</h1>
                <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase"><MapPin className="h-4 w-4 text-primary" /> {property.location}</div>
              </div>
              <Separator className="bg-slate-50" />
              <p className="text-xl text-slate-600 font-medium leading-relaxed">{property.description}</p>
            </div>
          </div>

          <aside className="space-y-8">
            <Card className="sticky top-40 border-none shadow-2xl overflow-hidden rounded-[3.5rem] bg-white text-foreground">
              <div className="bg-primary p-12 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10 rotate-12"><Zap className="h-32 w-32" /></div>
                <div className="relative z-10 space-y-2 text-white">
                  <div className="text-[10px] uppercase font-black tracking-[0.4em] opacity-60">Node Yield Price</div>
                  <div className="text-5xl font-headline font-black tracking-tighter">KES {bookingAmount.toLocaleString()}</div>
                  <div className="text-[9px] font-bold opacity-50 uppercase tracking-widest mt-4 flex items-center gap-2"><ShieldCheck className="h-3 w-3" /> Includes 3% Platform Sync</div>
                </div>
              </div>
              
              <CardContent className="p-12 space-y-10 text-foreground">
                <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full h-20 rounded-[2rem] text-xl font-black premium-gradient text-white shadow-xl shadow-primary/20 gap-3 group" disabled={isProcessing}>
                      Initialize Booking <ChevronRight className="h-6 w-6 group-hover:translate-x-1" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-[3rem] glass border-none p-12 max-w-2xl shadow-2xl text-foreground">
                    <DialogHeader className="mb-8">
                      <DialogTitle className="text-3xl font-black">Residency Synchronization</DialogTitle>
                      <DialogDescription className="font-medium text-slate-500 italic">3% Platform Escrow Protocol applied to this transaction.</DialogDescription>
                    </DialogHeader>

                    {bookingStep === 'CHOICE' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 text-foreground">
                        <Card className="p-8 rounded-[2.5rem] border-2 border-primary bg-primary/5 cursor-pointer hover:scale-[1.02] transition-all text-foreground" onClick={() => setBookingStep('PAYMENT')}>
                          <Zap className="h-10 w-10 text-primary mb-6" />
                          <h3 className="text-xl font-black mb-2 text-foreground">Pay Now</h3>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">Immediate residency lock via M-Pesa STK protocol.</p>
                        </Card>
                        <Card className="p-8 rounded-[2.5rem] border-2 border-slate-100 cursor-pointer hover:scale-[1.02] transition-all text-foreground" onClick={() => executeBookingProtocol(true)}>
                          <Clock className="h-10 w-10 text-slate-400 mb-6" />
                          <h3 className="text-xl font-black mb-2 text-foreground">Pay Later</h3>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed">Reserve for 24 hours. Identity sync must complete before expiry.</p>
                        </Card>
                      </div>
                    )}

                    {bookingStep === 'PAYMENT' && (
                      <div className="space-y-8 text-foreground">
                        <div className="grid gap-6 text-foreground">
                          <div className="space-y-2 text-foreground">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Full Identity Name</Label>
                            <Input placeholder="John Doe" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-medium text-foreground" />
                          </div>
                          <div className="space-y-2 text-foreground">
                            <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Handset Number (M-Pesa)</Label>
                            <Input placeholder="0712345678" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-medium text-foreground" />
                          </div>
                        </div>
                        <Button onClick={() => setBookingStep('STK_PUSH')} disabled={!formData.fullName || !formData.phone} className="w-full h-16 rounded-2xl premium-gradient font-black text-white text-lg shadow-xl">Transmit Sync Packet</Button>
                      </div>
                    )}

                    {bookingStep === 'STK_PUSH' && (
                      <div className="py-12 text-center space-y-10 animate-in zoom-in-95 text-foreground">
                        <div className="h-24 w-24 bg-primary/10 rounded-[2.5rem] flex items-center justify-center mx-auto text-primary animate-pulse"><Phone className="h-12 w-12" /></div>
                        <h3 className="text-3xl font-headline font-black text-foreground">STK Protocol Active</h3>
                        <p className="text-slate-500 font-medium max-w-xs mx-auto">Authorize <strong>KES {bookingAmount.toLocaleString()}</strong> on your handset identity node.</p>
                        <Button onClick={() => executeBookingProtocol(false)} className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black hover:bg-emerald-600 transition-colors">Verify PIN Sync</Button>
                      </div>
                    )}

                    {bookingStep === 'SUCCESS' && (
                      <div className="py-12 text-center space-y-8 animate-in zoom-in-95 text-foreground">
                        <div className="h-28 w-28 bg-emerald-500 rounded-[3rem] flex items-center justify-center mx-auto text-white shadow-2xl"><CheckCircle2 className="h-16 w-14" /></div>
                        <h3 className="text-4xl font-headline font-black text-foreground">Identity Locked.</h3>
                        <p className="text-slate-500 font-medium">Your residency node has been successfully synchronized.</p>
                        <Button className="w-full h-16 rounded-2xl bg-slate-900 text-white font-black" asChild><Link href="/dashboard/tenant">Go to Terminal</Link></Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </aside>
        </div>
      </main>
    </div>
  );
}