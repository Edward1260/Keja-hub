"use client";

import { useState, useEffect, Suspense } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { initiateEmailSignIn, initiateEmailSignUp } from "@/firebase/non-blocking-login";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Building2, Briefcase, Sparkles, Loader2, User, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";

function LoginContent() {
  const auth = useAuth();
  const db = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Tenant");
  const [isProcessing, setIsProcessing] = useState(false);
  const [invitationData, setInvitationData] = useState<any>(null);

  const tabFromUrl = searchParams.get("tab");
  const token = searchParams.get("token");

  useEffect(() => {
    const verifyToken = async () => {
      if (!token || !db) return;
      try {
        const inviteRef = doc(db, "invitations", token);
        const inviteSnap = await getDoc(inviteRef);
        
        if (inviteSnap.exists()) {
          const data = inviteSnap.data();
          const now = new Date().getTime();
          const expiry = new Date(data.expiresAt).getTime();

          if (!data.isUsed && now < expiry) {
            setInvitationData(data);
            setRole(data.recipientRole);
            toast({ title: "Authority Token Verified", description: `Authorized as ${data.recipientRole}. Auto-approval active.` });
          } else {
            toast({ variant: "destructive", title: "Token Expired", description: "Invitation link invalid." });
          }
        }
      } catch (err) {
        console.error("Token sync error:", err);
      }
    };
    verifyToken();
  }, [token, db, toast]);

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  
  const { data: profile, isLoading: isProfileLoading } = useDoc(userRef);

  useEffect(() => {
    if (user && !isProfileLoading && profile) {
      const roleMap: Record<string, string> = {
        "Admin": "/dashboard/admin",
        "Agent": "/dashboard/agent",
        "Landlord": "/dashboard/landlord",
        "Support": "/dashboard/support",
        "Tenant": "/dashboard/tenant",
        "Guest": "/dashboard/guest"
      };
      const targetRoute = roleMap[profile.role] || "/dashboard/guest";
      router.replace(targetRoute);
    }
  }, [user, profile, isProfileLoading, router]);

  const handleAuth = async (type: "login" | "signup") => {
    if (!email || !password) {
      toast({ variant: "destructive", title: "Missing Credentials" });
      return;
    }

    setIsProcessing(true);
    try {
      if (type === "login") {
        await initiateEmailSignIn(auth, email, password);
      } else {
        const isAutoApproved = !!invitationData;
        await initiateEmailSignUp(auth, db, email, password, role, isAutoApproved);
        
        if (token && db) {
          await updateDoc(doc(db, "invitations", token), {
            isUsed: true,
            usedAt: new Date().toISOString()
          });
        }
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Sync Error", description: error.message });
      setIsProcessing(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6 text-foreground text-foreground">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Establishing Neural Link</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="container mx-auto px-4 pt-32 pb-12 flex items-center justify-center min-h-[80vh]">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-lg">
          <Card className="glass border-none shadow-2xl rounded-[3rem] overflow-hidden">
            <Tabs defaultValue={tabFromUrl === 'signup' ? 'signup' : 'login'} className="w-full">
              <TabsList className="grid grid-cols-2 h-16 bg-secondary/20 p-1">
                <TabsTrigger value="login" className="font-black uppercase text-[10px] tracking-widest text-foreground">Login</TabsTrigger>
                <TabsTrigger value="signup" className="font-black uppercase text-[10px] tracking-widest text-foreground">Signup</TabsTrigger>
              </TabsList>
              <CardContent className="p-10 text-foreground text-foreground">
                <TabsContent value="login" className="space-y-6 text-foreground">
                  <div className="space-y-4 text-foreground">
                    <div className="space-y-2 text-foreground">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email Address</Label>
                      <Input type="email" placeholder="name@domain.node" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-medium text-foreground text-foreground" />
                    </div>
                    <div className="space-y-2 text-foreground">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Secure Cipher</Label>
                      <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-medium text-foreground text-foreground" />
                    </div>
                  </div>
                  <Button className="w-full h-16 rounded-2xl premium-gradient text-white font-black text-lg shadow-xl" onClick={() => handleAuth("login")} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin h-6 w-6" /> : "Establish Sync"}
                  </Button>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-8 text-foreground text-foreground">
                  <div className="space-y-4 text-foreground text-foreground text-foreground">
                    <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">
                      {invitationData ? "Authority Role Locked" : "Select Identity Role"}
                    </Label>
                    <div className="grid grid-cols-3 gap-3 text-foreground text-foreground text-foreground">
                      {[
                        { id: "Tenant", icon: <User />, label: "Tenant" },
                        { id: "Landlord", icon: <Building2 />, label: "Host" },
                        { id: "Agent", icon: <Briefcase />, label: "Agent" }
                      ].map(r => (
                        <button 
                          key={r.id} 
                          type="button"
                          disabled={!!invitationData}
                          onClick={() => setRole(r.id)} 
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all group", 
                            role === r.id ? "border-primary bg-primary/5 text-primary" : "border-slate-100 hover:bg-slate-50 text-slate-400",
                            invitationData && role !== r.id ? "opacity-20 grayscale" : ""
                          )}
                        >
                          <div className="h-6 w-6 group-hover:scale-110 transition-transform">{r.icon}</div>
                          <span className="text-[8px] font-black uppercase tracking-widest">{r.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 text-foreground">
                    <div className="space-y-2 text-foreground text-foreground">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email</Label>
                      <Input type="email" placeholder="name@domain.node" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-medium text-foreground text-foreground" />
                    </div>
                    <div className="space-y-2 text-foreground text-foreground">
                      <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Password</Label>
                      <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-medium text-foreground text-foreground" />
                    </div>
                  </div>
                  
                  <Button className="w-full h-16 rounded-2xl premium-gradient text-white font-black text-lg flex items-center justify-center gap-3 shadow-xl" onClick={() => handleAuth("signup")} disabled={isProcessing}>
                    {isProcessing ? <Loader2 className="animate-spin h-6 w-6" /> : <><Sparkles className="h-5 w-5" /> Initialize {role}</>}
                  </Button>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex flex-col items-center justify-center"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>}>
      <LoginContent />
    </Suspense>
  );
}