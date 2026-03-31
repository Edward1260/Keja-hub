"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Star, ArrowRight, ShieldCheck, Zap, Heart, Layers, UserPlus, Share2, Lock, Video, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useFirestore } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { generatePropertyVibe, type PropertyVibe } from "@/ai/flows/generate-property-vibe";

export function PropertyCard({ property }: { property: any }) {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [isHovered, setIsHovered] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [vibe, setVibe] = useState<PropertyVibe | null>(null);
  const [isAnalyzing, setIsMatching] = useState(false);

  // Hardened media selection
  const price = property.monthlyRent || property.monthlyRentPrice || 0;
  const rawImageUrl = property.imageUrl || property.imageUrls?.building || property.imageUrls?.[0];
  const imageUrl = rawImageUrl || `/placeholder-property.jpg`;
  const isBase64 = typeof imageUrl === 'string' && imageUrl.startsWith('data:');
  const hasVideo = !!property.videoUrl;

  useEffect(() => {
    // Generate AI Vibe Score on demand or mount
    const loadVibe = async () => {
      if (vibe || isAnalyzing) return;
      setIsMatching(true);
      try {
        const result = await generatePropertyVibe({
          title: property.title,
          description: property.description,
          location: property.location,
          amenities: property.amenities || []
        });
        setVibe(result);
      } catch (e) {
        console.error("Vibe analysis failed");
      } finally {
        setIsMatching(false);
      }
    };
    if (isHovered) loadVibe();
  }, [isHovered, property, vibe, isAnalyzing]);
  
  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || !db) {
      toast({ title: "Account Required", description: "Identity synchronization required to save nodes." });
      router.push("/login");
      return;
    }

    setIsSaving(true);
    try {
      const wishlistRef = doc(db, "users", user.uid, "wishlist", property.id);
      await setDoc(wishlistRef, {
        propertyId: property.id,
        addedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: "Node Saved", description: "Residency unit linked to your identity." });
    } catch (err) {
      toast({ variant: "destructive", title: "Sync Failed", description: "Could not establish neural link." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      whileHover={{ y: -16, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="h-full perspective-1000 text-foreground"
    >
      <Card className="group overflow-hidden glass-card border-none flex flex-col h-full rounded-[3.5rem] shadow-2xl relative preserve-3d text-foreground">
        <div className="relative aspect-[4/3] overflow-hidden p-4 text-foreground">
          <div className="relative h-full w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-slate-100 text-foreground">
            <Image
              src={imageUrl}
              alt={property.title}
              fill
              unoptimized={isBase64}
              className="object-cover transition-transform duration-1000 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <AnimatePresence>
              {isHovered && (
                <motion.div 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-10 text-foreground"
                >
                  {vibe ? (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 text-foreground">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="text-xl font-headline font-black text-white">{vibe.vibeLabel}</span>
                      </div>
                      <p className="text-xs text-white/70 font-medium leading-relaxed italic line-clamp-2">"{vibe.vibeDescription}"</p>
                      <div className="flex gap-2 pt-2">
                        {vibe.tags.map((tag, i) => (
                          <Badge key={i} className="bg-white/10 text-white border-none text-[8px] uppercase px-3 py-1 font-black tracking-widest">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-white/40 font-black text-[9px] uppercase tracking-[0.3em] animate-pulse">
                      <Zap className="h-4 w-4" /> Analyzing Node Vibe...
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="absolute top-8 left-8 flex flex-col gap-3 text-foreground">
            <Badge className="bg-white/95 backdrop-blur-xl text-primary font-black border-none px-6 py-2.5 shadow-2xl text-sm rounded-full">
              KES {price.toLocaleString()}
            </Badge>
            <div className="flex gap-2">
              {property.isVerified && (
                <Badge className="bg-emerald-500 text-white font-black px-4 py-1.5 shadow-xl text-[9px] uppercase tracking-widest rounded-full flex items-center gap-2">
                  <ShieldCheck className="h-3 w-3" /> VERIFIED
                </Badge>
              )}
            </div>
          </div>

          <div className="absolute top-8 right-8 flex flex-col gap-3 text-foreground">
            <button 
              onClick={handleToggleWishlist}
              disabled={isSaving}
              className="bg-white/95 backdrop-blur-xl p-4 rounded-[1.5rem] shadow-2xl text-slate-400 hover:text-rose-500 transition-all hover:scale-110 active:scale-95 relative"
            >
              {!user && <Lock className="absolute -top-1 -right-1 h-4 w-4 text-slate-900 bg-white rounded-full p-1 border border-slate-100 shadow-sm" />}
              <Heart className={cn("h-6 w-6 transition-colors", isSaving ? "animate-pulse text-rose-500" : "")} />
            </button>
          </div>
        </div>
        
        <CardContent className="p-10 flex-grow flex flex-col gap-6 text-foreground">
          <div className="space-y-4 text-foreground">
            <div className="flex items-center justify-between text-foreground">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 flex items-center gap-2">
                <Layers className="h-3 w-3" /> {property.category || 'Residential'} NODE
              </span>
              <div className="flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 rounded-full text-[10px] font-black text-slate-600 shadow-sm">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 border-none" />
                <span>{property.rating || '4.9'}</span>
              </div>
            </div>
            
            <h3 className="font-headline font-black text-2xl tracking-tighter leading-tight group-hover:text-primary transition-colors line-clamp-2 text-foreground">
              {property.title}
            </h3>
            
            <div className="flex items-center gap-3 text-muted-foreground text-foreground">
              <MapPin className="h-4 w-4 shrink-0 text-primary/30" />
              <span className="text-[10px] font-black uppercase tracking-widest truncate">{property.location || 'Nairobi Central'}</span>
            </div>
          </div>

          {vibe && (
            <div className="p-5 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-center justify-between group-hover:bg-primary/10 transition-colors text-foreground">
               <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-primary/60">Productivity Node</span>
                  <span className="text-xs font-black text-slate-900">{vibe.suitabilityScore}% SUITABLE</span>
               </div>
               <div className="h-10 w-10 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <BrainCircuit className="h-5 w-5 text-primary" />
               </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="p-10 pt-0 text-foreground">
          <Button asChild className="w-full h-16 rounded-[1.5rem] premium-gradient text-lg font-black tracking-tight group shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-3">
            <Link href={`/properties/${property.id}`}>
              View Node Specs <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
