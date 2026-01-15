import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, User, Bot, Loader2 } from "lucide-react";
import { RevisePlanRequest, WeeklyPlan } from "@/lib/api";

interface AgentViewProps {
    currentPlan: WeeklyPlan | null;
    onPlanUpdate: (plan: WeeklyPlan) => void;
    revisePlan: (req: RevisePlanRequest) => Promise<WeeklyPlan>;
}

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function AgentView({ currentPlan, onPlanUpdate, revisePlan }: AgentViewProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hello! I'm Biome, your training intelligence. I have your latest data and weekly plan ready. How can I help you adjust your training today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim() || !currentPlan) return;

        const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            // We use the 'revisePlan' API as our conversation driver for now
            const revisedPlan = await revisePlan({
                current_plan: currentPlan,
                feedback: input
            });

            onPlanUpdate(revisedPlan);

            // Extract the agent's response from the Goal (as per our earlier prompt engineering)
            // or fall back to a generic success message if the goal didn't change much.
            const agentResponseContent = revisedPlan.goal.includes('(')
                ? revisedPlan.goal
                : `I've updated your plan. The new goal is: ${revisedPlan.goal}. Check the Dashboard to see the changes.`;

            const agentMsg: Message = {
                role: 'assistant',
                content: agentResponseContent,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, agentMsg]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm having trouble connecting to my core logic right now. Please try again.",
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto rounded-3xl overflow-hidden border border-[color:var(--glass-border)] bg-[color:var(--glass-surface)] shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-[color:var(--glass-border)] flex items-center gap-3 bg-black/40">
                <div className="p-2 rounded-xl bg-white/10 text-white">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Biome Agent</h2>
                    <p className="text-sm text-[color:var(--muted-foreground)]">Connected • Context Active</p>
                </div>
            </div>

            {/* Chat Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5" />
                            </div>
                        )}

                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                                ? 'bg-white text-black rounded-tr-none'
                                : 'bg-[color:var(--card)] border border-[color:var(--glass-border)] text-[color:var(--foreground)] rounded-tl-none'
                            }`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-[10px] opacity-50 mt-2 text-right">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>

                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-[color:var(--card)] border border-[color:var(--glass-border)] flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-white" />
                            </div>
                        )}
                    </div>
                ))}

                {isTyping && (
                    <div className="flex gap-4">
                        <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="p-4 rounded-2xl bg-[color:var(--card)] border border-[color:var(--glass-border)] rounded-tl-none flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-[color:var(--muted-foreground)]" />
                            <span className="text-sm text-[color:var(--muted-foreground)]">Analyzing metrics...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-black/40 border-t border-[color:var(--glass-border)]">
                <div className="relative flex items-center">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Ask about your workout, weak points, or request changes..."
                        className="w-full bg-[color:var(--surface)] text-white border border-[color:var(--glass-border)] rounded-xl py-4 pl-4 pr-12 focus:outline-none focus:border-white/50 transition-colors"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isTyping}
                        className="absolute right-2 p-2 bg-white text-black rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
