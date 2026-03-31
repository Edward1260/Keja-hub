"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { PropertyCard } from "@/components/property/property-card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Sparkles, Loader2, Zap, Filter, Building2, MapPin, BrainCircuit } from "lucide-react";
import { matchPropertiesToStudent, MatchPropertiesToStudentOutput } from "@/ai/flows/match-properties-to-student";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCity, setActiveCity] = useState("all");
  const [activeType, setActiveType] = useState("all");
  const [isMatching, setIsMatching] = useState(false);
  const [recommendations, setRecommendations] = useState<MatchPropertiesToStudentOutput | null>(null);
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();

  const userRef = useMemoFirebase(() => {
    if (!db || !user) return null;
    return doc(db, "users", user.uid);
  }, [db, user]);
  
  const { data: profile } = useDoc(userRef);

  const propertiesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "properties"), orderBy("createdAt", "desc"));
  }, [db]);

  const { data: properties, isLoading: isPropsLoading } = useCollection(propertiesQuery);

  const handleAIMatch = async () => {
    if (!properties || properties.length === 0) {
      toast({ variant: "destructive", title: "Syncing Catalog", description: "Waiting for property nodes to synchronize..." });
      return;
    }
    setIsMatching(true);
    try {
      const studentProfile = {
        id: user?.uid || "guest",
        name: profile?.firstName || "Guest Resident",
        budget: { min: 5000, max: 200000 },
        desiredLocation: activeCity === "all" ? searchQuery || "Nairobi" : activeCity,
        roommatePreferences: ["quiet", "focused"],
        lifestyle: ["security prioritize", "high yield"],
        propertyTypePreferences: activeType === "all" ? ["apartment", "studio", "office"] : [activeType]
      };

      const result = await matchPropertiesToStudent({
        studentProfile,
        availableProperties: properties.map(p => ({
            id: p.id,
            name: p.title,
            description: p.description,
            location: p.location,
            price: p.monthlyRent || 0,
            propertyType: p.propertyType,
            isAvailable: p.isAvailable,
            amenities: p.amenities || []
        })) as any,
        searchHistory: searchQuery ? [{ query: searchQuery, results: [], timestamp: new Date().toISOString() }] : []
      });
      setRecommendations(result);
      toast({ title: "Neural Link Established", description: "AI has calculated your optimal residency match." });
    } catch (error) {
      toast({ variant: "destructive", title: "Matching Error", description: "Neural matching engine is momentarily unresponsive." });
    } finally {
      setIsMatching(false);
    }
  };

  const filteredProperties = properties?.filter(p => {
    const matchesQuery = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        p.location.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCity = activeCity === "all" || p.location.toLowerCase().includes(activeCity.toLowerCase());
    const matchesType = activeType === "all" || p.category?.toLowerCase() === activeType.toLowerCase();
    
    return matchesQuery && matchesCity && matchesType;
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12 pt-32">
        <div className="max-w-5xl mx-auto mb-16 space-y-16">
          <div className="text-center space-y-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center gap-3 px-6 py-2 bg-primary/5 rounded-full border border-primary/10 text-primary font-black text-[10px] uppercase tracking-[0.4em]"
            >
              <BrainCircuit className="h-4 w-4" /> Global Discovery Matrix
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-headline font-black tracking-tighter text-slate-900 leading-none">
              Find Your <span className="text-primary">Space.</span>
            </h1>
            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
              Synthesizing real-time urban asset data with personalized neural matching for the modern resident.
            </p>
          </div>

          <div className="space-y-10">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-col md:flex-row gap-4 p-6 glass rounded-[3.5rem] shadow-2xl relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
              <div className="relative flex-grow flex items-center">
                <Search className="absolute left-6 text-primary h-7 w-7" />
                <Input 
                  placeholder="Describe your ideal home (e.g., 'Quiet studio near UoN with Wi-Fi')..." 
                  className="pl-16 h-20 bg-transparent border-none rounded-3xl text-2xl font-black focus-visible:ring-0 placeholder:text-slate-300"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                onClick={handleAIMatch} 
                disabled={isMatching || isPropsLoading}
                className="h-20 px-12 rounded-[2rem] premium-gradient font-black text-xl gap-4 shadow-2xl shadow-primary/30 group relative z-10"
              >
                {isMatching ? <Loader2 className="animate-spin h-7 w-7" /> : <Sparkles className="h-7 w-7 group-hover:rotate-12 transition-transform" />}
                Execute Match
              </Button>
            </motion.div>

            <div className="flex flex-col md:flex-row justify-between gap-8 items-start md:items-center px-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  <MapPin className="h-3 w-3" /> Spatial Nodes
                </div>
                <Tabs defaultValue="all" onValueChange={setActiveCity}>
                  <TabsList className="bg-slate-100/50 rounded-full h-14 p-1.5 border border-slate-200">
                    {["All", "Nairobi", "Mombasa", "Kisumu"].map(city => (
                      <TabsTrigger key={city} value={city.toLowerCase()} className="rounded-full px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">
                        {city}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                  <Building2 className="h-3 w-3" /> Asset Protocol
                </div>
                <Tabs defaultValue="all" onValueChange={setActiveType}>
                  <TabsList className="bg-slate-100/50 rounded-full h-14 p-1.5 border border-slate-200">
                    {["All", "Residential", "Commercial"].map(type => (
                      <TabsTrigger key={type} value={type.toLowerCase()} className="rounded-full px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-lg">
                        {type}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {recommendations && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-24"
            >
              <div className="flex items-center justify-between mb-12 px-6">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-primary/10 rounded-[2.5rem] shadow-xl shadow-primary/5">
                    <Zap className="text-primary h-10 w-10 fill-primary" />
                  </div>
                  <div>
                    <h2 className="text-5xl font-headline font-black tracking-tight text-slate-900">Neural Solutions.</h2>
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mt-1">High Accuracy Matches Projected</p>
                  </div>
                </div>
                <Button variant="ghost" className="rounded-full h-14 px-10 font-black text-slate-400 hover:text-rose-500 hover:bg-rose-50 uppercase text-[10px] tracking-widest" onClick={() => setRecommendations(null)}>Reset Engine</Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 p-12 bg-primary/5 rounded-[5rem] border-4 border-dashed border-primary/10 relative overflow-hidden shadow-inner">
                {recommendations.recommendations.map((rec, i) => {
                  const prop = properties?.find(p => p.id === rec.id);
                  if (!prop) return null;
                  return (
                    <motion.div key={rec.id} initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                       <div className="relative h-full">
                          <div className="absolute top-10 left-10 z-20 bg-primary text-white font-black text-[10px] px-6 py-2.5 rounded-full uppercase tracking-[0.2em] shadow-2xl flex items-center gap-2">
                            <Sparkles className="h-3 w-3" /> MATCH: {rec.matchScore}%
                          </div>
                          <PropertyCard property={prop as any} />
                       </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-16">
          <div className="flex items-center justify-between border-b border-slate-100 pb-12 px-6">
            <div className="flex items-center gap-6 text-foreground">
              <div className="p-4 bg-slate-900 rounded-3xl text-white shadow-xl"><Filter className="h-8 w-8" /></div>
              <div>
                <h2 className="text-5xl font-headline font-black tracking-tighter text-slate-900">Verified Matrix.</h2>
                <p className="text-sm text-slate-400 font-medium tracking-tight">Projecting {filteredProperties?.length || 0} secure nodes.</p>
              </div>
            </div>
          </div>
          
          {isPropsLoading ? (
            <div className="flex flex-col items-center justify-center py-60 gap-6">
              <Loader2 className="animate-spin h-16 w-16 text-primary" />
              <p className="font-black text-[10px] uppercase tracking-[0.5em] text-primary animate-pulse">Syncing Ledger</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredProperties && filteredProperties.length > 0 ? (
                <motion.div layout className="grid md:grid-cols-2 lg:grid-cols-3 gap-16">
                  {filteredProperties.map((p) => (
                    <motion.div key={p.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                      <PropertyCard property={p as any} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-60 glass rounded-[5rem] border-4 border-dashed border-primary/10">
                  <Search className="h-20 w-20 text-primary/10 mx-auto mb-10" />
                  <p className="text-3xl font-headline font-black text-slate-300 uppercase tracking-tighter">No Active Nodes Detected.</p>
                  <Button variant="ghost" className="mt-8 text-primary font-black h-16 px-12 rounded-full border-2 border-primary/5 hover:bg-primary/5 uppercase text-[10px] tracking-widest" onClick={() => { setSearchQuery(""); setActiveCity("all"); setActiveType("all"); }}>Initialize Global Scan</Button>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>
    </div>
  );
}
