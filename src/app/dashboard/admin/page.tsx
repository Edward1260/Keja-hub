"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { 
  ShieldAlert, Users, LayoutDashboard, 
  LogOut, Search, Loader2, Building2, 
  Settings, UserCircle, Send
} from "lucide-react";
import { useUser, useFirestore, useCollection, useMemoFirebase, useAuth, useDoc } from "@/firebase";
import { useRouter } from "next/navigation";
import { 
  SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter, 
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger 
} from "@/components/ui/sidebar";
import { collection, query, limit, doc, orderBy } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileSettings } from "@/components/profile/profile-settings";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { SidebarNavigationProvider, useSidebarNavigation } from "@/hooks/use-sidebar-navigation";
// Removed dummy firebaseConfig - use proper config from @/firebase/config
import { OverviewTab } from "@/components/dashboard/admin/overview-tab";
import { UsersTab } from "@/components/dashboard/admin/users-tab";
import { InvitationsTab } from "@/components/dashboard/admin/invitations-tab";

function AdminDashboardContent() {
  const { activeTab, setActiveTab } = useSidebarNavigation();
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const auth = useAuth();
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const userProfileRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc(userProfileRef);

  const isAdmin = profile?.role?.toUpperCase() === "ADMIN";

  useEffect(() => {
    if (!isUserLoading && !isProfileLoading && (!user || profile?.role?.toUpperCase() !== "ADMIN")) {
      if (user && profile) {
        const target = profile.role?.toLowerCase() === 'tenant' ? '/dashboard/tenant' : 
                       profile.role?.toLowerCase() === 'landlord' ? '/dashboard/landlord' : 
                       profile.role?.toLowerCase() === 'agent' ? '/dashboard/agent' : '/dashboard/guest';
        router.push(target);
      } else if (!user && !isUserLoading) {
        router.push("/");
      }
    }
  }, [user, profile, isUserLoading, isProfileLoading, router]);

  const usersQuery = useMemoFirebase(() => 
    (db && user && isAdmin) ? query(collection(db, "users"), limit(100)) : null, 
    [db, user, isAdmin]
  );
  const { data: allUsers } = useCollection(usersQuery);

  const propertiesQuery = useMemoFirebase(() => 
    (db && user && isAdmin) ? query(collection(db, "properties"), limit(100)) : null, 
    [db, user, isAdmin]
  );
  const { data: allProperties } = useCollection(propertiesQuery);

  const bookingsQuery = useMemoFirebase(() => 
    (db && user && isAdmin) ? query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(100)) : null, 
    [db, user, isAdmin]
  );
  const { data: allBookings } = useCollection(bookingsQuery);

  if (isUserLoading || isProfileLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-6">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Loading...</p>

      </div>
    );
  }

  if (!user || !isAdmin) return null;

  const sidebarItems = useMemo(() => [
    { id: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
{ id: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
{ id: 'properties', label: 'Properties', icon: <Building2 className="h-4 w-4" /> },
{ id: 'invitations', label: 'Invitations', icon: <Send className="h-4 w-4" /> },
{ id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ], []);

  return (
    <div className="min-h-screen bg-slate-50/30 flex w-full">
      <Sidebar className="border-r border-slate-200/60 glass" collapsible="icon">
        <SidebarHeader className="p-6">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => router.push("/")}>
            <div className="bg-slate-900 p-2.5 rounded-2xl shadow-xl">
              <ShieldAlert className="text-white h-5 w-5" />
            </div>
<span className="font-headline font-black text-xl tracking-tighter text-slate-900 group-data-[collapsible=icon]:hidden">Admin</span>
          </div>
        </SidebarHeader>
        <SidebarContent className="px-4">
          <SidebarMenu className="space-y-1">
            {sidebarItems.map(item => (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton 
                  isActive={activeTab === item.id} 
                  onClick={() => setActiveTab(item.id)} 
                  className={cn(
                    "h-12 rounded-xl font-bold uppercase text-[10px] tracking-[0.15em]",
                    activeTab === item.id ? "bg-slate-900 text-white shadow-xl" : "hover:bg-slate-100 text-slate-500"
                  )}
                >
                  {item.icon} <span className="ml-3 group-data-[collapsible=icon]:hidden">{item.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-6 border-t border-slate-100/60">
            <Button variant="ghost" className="w-full justify-start text-rose-500 font-black h-12 rounded-xl" onClick={() => signOut(auth)}>
            <LogOut className="h-4 w-4 mr-3" /> <span className="group-data-[collapsible=icon]:hidden">Logout</span>

          </Button>
        </SidebarFooter>
      </Sidebar>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-24 glass border-b border-slate-200/60 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-4 md:gap-8 flex-1">
            <SidebarTrigger className="p-2 bg-slate-100 text-slate-900 rounded-full hover:bg-slate-200 transition-colors" />
            <div className="relative max-w-md w-full hidden md:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input placeholder="Search users..." className="pl-12 h-12 bg-slate-50/50 border-none rounded-2xl focus-visible:ring-slate-900/20" />
</xai:function_call >
<xai:function_call name="edit_file">
<parameter name="path">NairobiPad-01-main/src/app/dashboard/admin/page.tsx
            </div>
          </div>

          <div className="flex items-center gap-4 md:gap-6">
            <NotificationBell />
            <div 
              className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden cursor-pointer hover:scale-105 transition-transform"
              onClick={() => setIsProfileOpen(true)}
            >
              {profile?.photoUrl ? (
                <img src={profile.photoUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : <UserCircle className="h-7 w-7 text-slate-900" />}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-12 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="container mx-auto space-y-12">
              {activeTab === 'overview' && (
                <OverviewTab users={allUsers} properties={allProperties} bookings={allBookings} isMounted={isMounted} />
              )}

              {activeTab === 'invitations' && (
                <InvitationsTab />
              )}

              {activeTab === 'users' && (
                <UsersTab users={allUsers} />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <ProfileSettings open={isProfileOpen} onOpenChange={setIsProfileOpen} />
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <SidebarProvider>
      <SidebarNavigationProvider>
        <AdminDashboardContent />
      </SidebarNavigationProvider>
    </SidebarProvider>
  );
}
