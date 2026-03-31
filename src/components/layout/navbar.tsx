"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Building2, Search, Menu, X, LogOut, LayoutDashboard, UserCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useAuth, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const userRef = useMemoFirebase(() => (db && user) ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userRef);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const getDashboardLink = () => {
    if (!profile) return "/dashboard/guest";
    const map: any = { Admin: "/dashboard/admin", Agent: "/dashboard/agent", Landlord: "/dashboard/landlord", Support: "/dashboard/support", Guest: "/dashboard/guest", Tenant: "/dashboard/tenant" };
    return map[profile.role] || "/dashboard/guest";
  };

  return (
    <nav className={cn("fixed top-0 z-[100] w-full transition-all duration-500", scrolled ? "py-3" : "py-6")}>
      <div className="container mx-auto px-4">
        <div className={cn("h-16 px-8 flex items-center justify-between rounded-[2rem]", scrolled ? "glass shadow-xl py-2" : "bg-transparent")}>
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-primary p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform"><Building2 className="text-white h-6 w-6" /></div>
            <span className="font-headline font-black text-2xl tracking-tighter text-primary">NairobiPad</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/search" className="text-[10px] font-black uppercase tracking-[0.2em] hover:text-primary transition-colors flex items-center gap-2 text-foreground"><Search className="h-4 w-4" /> Intelligence</Link>
            
            {user && (
              <div className="flex items-center gap-4">
                <NotificationBell />

                <Link href={getDashboardLink()} className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2 px-5 py-2.5 glass rounded-full hover:bg-white transition-all shadow-sm">
                  <LayoutDashboard className="h-4 w-4" /> Hub
                </Link>
                <div className="h-11 w-11 rounded-full bg-primary/10 border-2 border-white overflow-hidden cursor-pointer shadow-sm" onClick={() => setIsProfileOpen(true)}>
                  {profile?.photoUrl ? <img src={profile.photoUrl} className="h-full w-full object-cover" /> : <UserCircle className="h-7 w-7 text-primary m-1.5" />}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-4 border-l border-border/50 pl-8">
              {user ? (
                <Button variant="ghost" size="icon" className="rounded-full bg-slate-50 h-11 w-11 hover:bg-rose-50 hover:text-rose-500 transition-colors" onClick={handleLogout}><LogOut className="h-5 w-5" /></Button>
              ) : (
                <div className="flex gap-3">
                  <Button variant="ghost" className="rounded-full px-6 h-11 font-black text-[10px] uppercase text-foreground" asChild><Link href="/login">Login</Link></Button>
                  <Button className="premium-gradient rounded-full px-8 h-11 font-black shadow-lg text-[10px] uppercase text-white" asChild><Link href="/login?tab=signup">Signup</Link></Button>
                </div>
              )}
            </div>
          </div>
          
          <button className="md:hidden p-3 glass rounded-full" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6 text-foreground" />}</button>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="md:hidden container mx-auto px-4 mt-2 text-foreground">
            <div className="glass rounded-[2rem] p-8 flex flex-col gap-6">
              <Link href="/search" className="text-sm font-black uppercase tracking-widest flex items-center gap-3" onClick={() => setIsMenuOpen(false)}><Search className="h-5 w-5" /> Intelligence</Link>
              {user && <Link href={getDashboardLink()} className="text-sm font-black uppercase tracking-widest flex items-center gap-3" onClick={() => setIsMenuOpen(false)}><LayoutDashboard className="h-5 w-5" /> Hub</Link>}
              {user ? (
                <Button variant="destructive" className="w-full h-14 rounded-2xl font-black uppercase text-xs" onClick={handleLogout}>Log Out</Button>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-14 rounded-2xl font-black" asChild onClick={() => setIsMenuOpen(false)}><Link href="/login">Login</Link></Button>
                  <Button className="premium-gradient h-14 rounded-2xl font-black text-white" asChild onClick={() => setIsMenuOpen(false)}><Link href="/login?tab=signup">Signup</Link></Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ProfileSettings open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </nav>
  );
}