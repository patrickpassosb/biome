import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, User, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatRequest, ChatResponse, WeeklyPlan } from "@/lib/api";

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    agentPersona?: string;
    proposedPlan?: WeeklyPlan;
}

interface AgentViewProps {
    currentPlan: WeeklyPlan | null;
    onPlanUpdate: (plan: WeeklyPlan) => void;
    chatWithAgent: (req: ChatRequest) => Promise<ChatResponse>;
    messages: Message[];
    setMessages: (msgs: Message[] | ((prev: Message[]) => Message[])) => void;
}

export function AgentView({ currentPlan, onPlanUpdate, chatWithAgent, messages, setMessages }: AgentViewProps) {
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
            // Map our messages to the API format
            const chatMessages = messages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp.toISOString(),
                agent_persona: m.agentPersona
            }));
            chatMessages.push({
                role: 'user',
                content: input,
                timestamp: new Date().toISOString(),
                agent_persona: undefined
            });

            const response = await chatWithAgent({
                messages: chatMessages,
                current_plan: currentPlan
            });

            const agentMsg: Message = {
                role: 'assistant',
                content: response.message,
                timestamp: new Date(),
                agentPersona: response.agent_persona,
                proposedPlan: response.proposed_plan
            };
            setMessages(prev => [...prev, agentMsg]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "The team is momentarily unavailable. Let me check the logs and I'll be right back.",
                timestamp: new Date(),
                agentPersona: "System"
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleApprovePlan = (plan: WeeklyPlan) => {
        onPlanUpdate(plan);
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: "Excellent! I've updated your main training plan. You can see the new structure on your Dashboard.",
            timestamp: new Date(),
            agentPersona: "Workout Specialist"
        }]);
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto rounded-3xl overflow-hidden border border-[color:var(--glass-border)] bg-[color:var(--glass-surface)] shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-[color:var(--glass-border)] flex items-center gap-3 bg-black/40">
                <div className="p-2 rounded-xl bg-white/10 text-white">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Biome Team</h2>
                    <p className="text-sm text-[color:var(--muted-foreground)]">Workout • Nutrition • Sleep Recovery</p>
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
                            {msg.agentPersona && (
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                                        {msg.agentPersona}
                                    </span>
                                </div>
                            )}
                            <div className="prose prose-invert max-w-none text-sm leading-relaxed">
                                <ReactMarkdown
                                    components={{
                                        strong: ({ ...props }) => <strong className="font-bold text-white shadow-[0_0_10px_rgba(255,255,255,0.2)]" {...props} />,
                                        p: ({ ...props }) => <p className="mb-3 last:mb-0" {...props} />,
                                        ul: ({ ...props }) => <ul className="list-disc ml-4 mb-3 space-y-1" {...props} />,
                                        li: ({ ...props }) => <li className="text-[color:var(--foreground)]" {...props} />,
                                        h1: ({ ...props }) => <h1 className="text-lg font-bold mb-2 mt-4 first:mt-0" {...props} />,
                                        h2: ({ ...props }) => <h2 className="text-md font-bold mb-2 mt-4 first:mt-0" {...props} />,
                                    }}
                                >
                                    {msg.content}
                                </ReactMarkdown>
                            </div>

                            {msg.proposedPlan && (
                                <div className="mt-4 p-4 rounded-xl bg-white/5 border border-white/10 animate-in slide-in-from-bottom-2">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-medium text-white/60">Suggested Plan Update</span>
                                        <Sparkles className="w-4 h-4 text-white/40" />
                                    </div>
                                    <p className="text-sm font-medium text-white mb-3">Goal: {msg.proposedPlan.goal}</p>
                                    <button
                                        onClick={() => handleApprovePlan(msg.proposedPlan!)}
                                        className="w-full py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-white/90 transition-colors"
                                    >
                                        Approve & Update Plan
                                    </button>
                                </div>
                            )}

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
