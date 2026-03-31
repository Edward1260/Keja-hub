
"use client";

import { useState, useEffect, useRef } from "react";
import { use } from "react";
import { Navbar } from "@/components/layout/navbar";
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, serverTimestamp, doc } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, ArrowLeft, User, ShieldCheck, Phone } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function ChatPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Split sessionId to find participants
  const [p1, p2] = sessionId.split('_');
  const otherUserId = p1 === user?.uid ? p2 : p1;

  const otherUserRef = useMemoFirebase(() => db ? doc(db, "users", otherUserId) : null, [db, otherUserId]);
  const { data: otherUser } = useDoc(otherUserRef);

  const messagesQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(
      collection(db, "chatSessions", sessionId, "messages"),
      orderBy("timestamp", "asc")
    );
  }, [db, sessionId]);

  const { data: messages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !db) return;

    const messagesRef = collection(db, "chatSessions", sessionId, "messages");
    addDocumentNonBlocking(messagesRef, {
      chatSessionId: sessionId,
      senderId: user.uid,
      messageContent: newMessage,
      timestamp: serverTimestamp(),
      isRead: false,
    });

    setNewMessage("");
  };

  if (isUserLoading || isMessagesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin h-12 w-12 text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 pt-32 pb-8 max-w-4xl flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="rounded-full glass h-12 w-12" onClick={() => router.back()}>
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div className="flex flex-col">
               <h1 className="text-2xl font-headline font-black tracking-tight flex items-center gap-3">
                 Secure Channel <ShieldCheck className="h-5 w-5 text-primary" />
               </h1>
               <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">End-to-End Encrypted Node</p>
            </div>
          </div>
          <Button variant="outline" className="rounded-full h-12 px-6 border-2 border-slate-100 font-black gap-2 hover:bg-emerald-50 hover:text-emerald-600 transition-all" asChild>
            <a href="tel:+254700000000"><Phone className="h-4 w-4" /> Initialize Voice Link</a>
          </Button>
        </div>

        <Card className="flex-grow flex flex-col glass border-none rounded-[3rem] overflow-hidden shadow-2xl relative">
          <div className="absolute top-0 inset-x-0 h-2 premium-gradient opacity-50" />
          
          <CardHeader className="p-8 border-b border-border/50 bg-secondary/20 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden">
                {otherUser?.photoUrl ? <img src={otherUser.photoUrl} className="h-full w-full object-cover" /> : <User className="h-6 w-6 text-primary" />}
              </div>
              <div>
                <CardTitle className="text-xl font-headline font-black">{otherUser?.firstName || 'Participant'}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Online</span>
                </div>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] uppercase px-4 py-1.5">{otherUser?.role?.toUpperCase() || 'NODE'}</Badge>
          </CardHeader>

          <CardContent className="flex-grow p-0">
            <ScrollArea className="h-[45vh] p-8">
              <div className="space-y-6">
                {messages?.map((msg, i) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div key={msg.id} className={cn("flex flex-col max-w-[80%]", isMe ? "ml-auto items-end" : "items-start")}>
                      <div className={cn(
                        "p-5 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm",
                        isMe ? "bg-primary text-white rounded-tr-none" : "glass rounded-tl-none text-foreground"
                      )}>
                        {msg.messageContent}
                      </div>
                      <span className="mt-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 px-2">
                        {msg.timestamp?.toDate ? format(msg.timestamp.toDate(), 'HH:mm') : 'Syncing...'}
                      </span>
                    </div>
                  );
                })}
                <div ref={scrollRef} />
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-8 border-t border-border/50 bg-secondary/5">
            <form onSubmit={handleSendMessage} className="w-full flex gap-4">
              <Input 
                placeholder="Secure message..." 
                className="flex-grow rounded-2xl h-14 glass border-none px-6 font-medium focus-visible:ring-primary text-foreground"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl premium-gradient shadow-xl" disabled={!newMessage.trim()}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
