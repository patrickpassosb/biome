/**
 * AgentView Component
 *
 * Provides a real-time chat interface for interacting with the Biome AI coaching team.
 * Users can ask questions about their training, request plan adjustments, and
 * approve suggested updates directly from the chat.
 */

import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, User, Bot, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatRequest, ChatResponse, WeeklyPlan } from "@/lib/api";

/**
 * Message Interface
 * Represents a single entry in the chat history.
 */
export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    agentPersona?: string; // e.g., 'Workout Specialist'
    proposedPlan?: WeeklyPlan; // Included if the AI suggests a new protocol
}

interface AgentViewProps {
    currentPlan: WeeklyPlan | null; // The active plan for context injection
    onPlanUpdate: (plan: WeeklyPlan) => void; // Callback to save a new plan
    chatWithAgent: (req: ChatRequest) => Promise<ChatResponse>; // API interaction
    messages: Message[]; // List of messages to display
    setMessages: (msgs: Message[] | ((prev: Message[]) => Message[])) => void; // State updater
}

export function AgentView({ currentPlan, onPlanUpdate, chatWithAgent, messages, setMessages }: AgentViewProps) {
    // Local state for the text input field.
    const [input, setInput] = useState("");
    // Boolean flag to show the typing indicator while the LLM is thinking.
    const [isTyping, setIsTyping] = useState(false);
    // Reference to the scrollable container for auto-scrolling to new messages.
    const scrollRef = useRef<HTMLDivElement>(null);

    /**
     * Effect: Auto-scroll to the bottom of the chat whenever the message list grows.
     */
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    /**
     * handleSend
     *
     * Orchestrates the user-initiated message flow.
     */
    const handleSend = async () => {
        // Prevent empty messages or sending without plan context.
        if (!input.trim() || !currentPlan) return;

        const userMsg: Message = { role: 'user', content: input, timestamp: new Date() };

        // Optimistically update the UI with the user's message.
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            // 1. TRANSFORM: Map internal message format to the API request format.
            const chatMessages = messages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.timestamp.toISOString(),
                agent_persona: m.agentPersona
            }));

            // Add the current user message to the historical context.
            chatMessages.push({
                role: 'user',
                content: input,
                timestamp: new Date().toISOString(),
                agent_persona: undefined
            });

            // 2. API CALL: Send the conversation history and state to the AI Agent.
            const response = await chatWithAgent({
                messages: chatMessages,
                current_plan: currentPlan
            });

            // 3. UPDATE: Add the AI's structured response to the chat.
            const agentMsg: Message = {
                role: 'assistant',
                content: response.message,
                timestamp: new Date(),
                agentPersona: response.agent_persona,
                proposedPlan: response.proposed_plan
            };
            setMessages(prev => [...prev, agentMsg]);
        } catch (error) {
            // Error Handling: Surface the backend error to avoid silent fallback behavior.
            const message = error instanceof Error ? error.message : "Agent request failed.";
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: `Agent system error: ${message}`,
                timestamp: new Date(),
                agentPersona: "System"
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    /**
     * handleApprovePlan
     *
     * Triggered when the user clicks 'Approve & Update Plan' on an AI suggestion.
     */
    const handleApprovePlan = (plan: WeeklyPlan) => {
        onPlanUpdate(plan);
        setMessages(prev => [...prev, {
            role: 'assistant',
            content: "Excellent! I've updated your main training plan. You can see the new structure here.",
            timestamp: new Date(),
            agentPersona: "Workout Specialist"
        }]);
    };

    return (
        <div className="flex flex-col h-full max-w-4xl mx-auto rounded-3xl overflow-hidden border border-[color:var(--glass-border)] bg-[color:var(--glass-surface)] shadow-2xl">
            {/* --- Chat Header --- */}
            <div className="p-6 border-b border-[color:var(--glass-border)] flex items-center gap-3 bg-black/40">
                <div className="p-2 rounded-xl bg-white/10 text-white">
                    <Sparkles className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white">Biome Team</h2>
                    <p className="text-sm text-[color:var(--muted-foreground)]">Workout • Nutrition • Sleep Recovery</p>
                </div>
            </div>

            {/* --- Message History --- */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {/* Bot Avatar */}
                        {msg.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5" />
                            </div>
                        )}

                        {/* Message Bubble */}
                        <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user'
                            ? 'bg-white text-black rounded-tr-none'
                            : 'bg-[color:var(--card)] border border-[color:var(--glass-border)] text-[color:var(--foreground)] rounded-tl-none'
                            }`}>
                            {/* Agent Identity Label */}
                            {msg.agentPersona && (
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                                        {msg.agentPersona}
                                    </span>
                                </div>
                            )}

                            {/* Render AI content using Markdown */}
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

                            {/* Plan Suggestion Card (Conditional) */}
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

                            {/* Message Timestamp */}
                            <p className="text-[10px] opacity-50 mt-2 text-right">
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>

                        {/* User Avatar */}
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-[color:var(--card)] border border-[color:var(--glass-border)] flex items-center justify-center shrink-0">
                                <User className="w-5 h-5 text-white" />
                            </div>
                        )}
                    </div>
                ))}

                {/* Typing Indicator */}
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

            {/* --- Chat Input Area --- */}
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
