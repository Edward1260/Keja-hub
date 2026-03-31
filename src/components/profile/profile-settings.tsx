"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUser, useFirestore, useDoc, useMemoFirebase } from "@/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword, updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Camera, Lock, Mail, ShieldCheck, UserCircle, Upload, X, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettings({ open, onOpenChange }: ProfileSettingsProps) {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  
  const userRef = useMemoFirebase(() => (db && user) ? doc(db, "users", user.uid) : null, [db, user]);
  const { data: profile } = useDoc(userRef);

  const [isUpdating, setIsUpdating] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || "");
      setLastName(profile.lastName || "");
      setPhoneNumber(profile.phoneNumber || "");
    }
  }, [profile]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast({ variant: "destructive", title: "File Too Large", description: "Visual node must be under 1MB." });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string);
      toast({ title: "Visual Node Encoded" });
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !user) return;
    setIsUpdating(true);
    try {
      const updates: any = {};
      if (firstName) updates.firstName = firstName;
      if (lastName) updates.lastName = lastName;
      if (phoneNumber) updates.phoneNumber = phoneNumber;
      if (photoUrl) updates.photoUrl = photoUrl;

      await updateDoc(doc(db, "users", user.uid), updates);

      if (firstName || lastName || photoUrl) {
        await updateProfile(user, {
          displayName: `${firstName} ${lastName}`.trim(),
          photoURL: photoUrl || user.photoURL
        });
      }

      if (newPassword) {
        await updatePassword(user, newPassword);
      }

      toast({ title: "Identity Hub Updated", description: "Your profile parameters have been synchronized." });
      onOpenChange(false);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Sync Error", description: err.message });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[3rem] p-10 glass border-none max-w-2xl text-foreground max-h-[90vh] overflow-y-auto shadow-2xl">
        <DialogHeader>
          <div className="p-4 bg-primary/10 w-fit rounded-3xl mb-6"><UserCircle className="h-10 w-10 text-primary" /></div>
          <DialogTitle className="text-3xl font-black tracking-tighter">Identity Configuration</DialogTitle>
          <DialogDescription className="font-medium text-slate-500">Update your platform residency credentials and visual node.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleUpdateProfile} className="space-y-10 pt-8">
          <div className="flex flex-col items-center gap-6 pb-8 border-b border-slate-100">
            <Label htmlFor="profile-photo" className="relative group cursor-pointer">
              <div className="h-32 w-32 rounded-[2.5rem] bg-slate-100 border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center">
                {(photoUrl || profile?.photoUrl) ? (
                  <img src={photoUrl || profile?.photoUrl} className="h-full w-full object-cover" />
                ) : <User className="h-12 w-12 text-slate-300" />}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Upload className="text-white h-6 w-6" />
              </div>
              <input type="file" id="profile-photo" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </Label>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Update Visual Telemetry</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">First Name</Label>
              <Input placeholder="John" value={firstName} onChange={e => setFirstName(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2">Last Name</Label>
              <Input placeholder="Doe" value={lastName} onChange={e => setLastName(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-foreground" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2"><Phone className="h-3 w-3" /> Handset Protocol</Label>
              <Input placeholder="0712345678" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 ml-2 flex items-center gap-2"><Lock className="h-3 w-3" /> New Cipher (Password)</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none px-6 text-foreground" placeholder="••••••••" />
            </div>
          </div>

          <Button type="submit" disabled={isUpdating} className="w-full h-16 rounded-2xl premium-gradient text-white font-black text-lg shadow-xl shadow-primary/20">
            {isUpdating ? <Loader2 className="animate-spin h-6 w-6" /> : "Authorize Identity Sync"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}