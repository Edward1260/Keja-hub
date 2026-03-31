'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, MessageCircle, X, Send, Loader2, Bot } from 'lucide-react';
import { rentalAssistant, type RentalAssistantOutput } from '@/ai/flows/rental-assistant-flow';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export function RentalAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([
    { role: 'ai', text: 'Jambo! I am your NairobiPad concierge. How can I help you find your next space today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async (text: string = query) => {
    if (!text.trim() || isLoading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setQuery('');
    setIsLoading(true);

    try {
      const result = await rentalAssistant({ 
        userQuery: text,
        context: "The user is browsing NairobiPad, a premium rental platform for Residential and Commercial nodes."
      });
      setMessages(prev => [...prev, { role: 'ai', text: result.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to my neural network. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[200]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="mb-4"
          >
            <Card className="w-[380px] h-[500px] glass border-none shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col">
              <CardHeader className="premium-gradient p-6 text-white flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl">
                    <Bot className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-black tracking-tight">AI Concierge</CardTitle>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Neural Search Active</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={() => setIsOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </CardHeader>
              <CardContent className="flex-grow p-0">
                <ScrollArea className="h-[340px] p-6">
                  <div className="space-y-4">
                    {messages.map((msg, i) => (
                      <div key={i} className={cn("flex flex-col max-w-[85%]", msg.role === 'user' ? "ml-auto items-end" : "items-start")}>
                        <div className={cn(
                          "p-4 rounded-2xl text-xs font-medium leading-relaxed shadow-sm",
                          msg.role === 'user' ? "bg-primary text-white rounded-tr-none" : "bg-secondary/50 rounded-tl-none"
                        )}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-center gap-2 text-primary animate-pulse">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Calculating...</span>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="p-4 border-t border-border/50">
                <div className="relative w-full">
                  <Input 
                    placeholder="Ask about areas, prices..." 
                    className="pr-12 rounded-xl bg-secondary/20 border-none h-12"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  />
                  <Button 
                    size="icon" 
                    className="absolute right-1 top-1 h-10 w-10 rounded-lg premium-gradient"
                    onClick={() => handleSend()}
                    disabled={isLoading}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-16 w-16 rounded-full shadow-2xl transition-all hover:scale-110",
          isOpen ? "bg-slate-900" : "premium-gradient"
        )}
      >
        {isOpen ? <X className="h-7 w-7" /> : <Sparkles className="h-7 w-7" />}
      </Button>
    </div>
  );
}
