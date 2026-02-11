import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { BrowserRouter as Router } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
    ResponsiveContainer, Cell, PieChart, Pie, Radar, RadarChart,
    PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import {
    Activity, Settings, Thermometer, Cpu, Clock, AlertTriangle,
    CheckCircle2, Gauge as GaugeIcon, Zap, Wrench, Info, Play,
    ZapOff, Terminal, ShieldAlert, LayoutDashboard, Box, BarChart3,
    Bell, Search, User, LogOut, ChevronRight, BookOpen, HelpCircle,
    Lightbulb, History, Languages, Filter, ArrowRight, Loader2,
    Database, Binary, Microscope, Compass, Server, ShieldCheck,
    ChevronDown, MessageSquare, Mail, Github, Twitter,
    Bot, X, Send
} from 'lucide-react';

// Production API (Render)
const API_BASE = 'https://sentinel-5aks.onrender.com';
const API_URL = `${API_BASE}/predict`;
const HISTORY_URL = `${API_BASE}/history`;
const CHAT_URL = `${API_BASE}/chat`; // Assuming this was defined or needs to be

// --- Utils ---
const cToK = (c) => parseFloat(c) + 273.15;

// --- Specialized Components ---

const NeuralNexus = ({ risk }) => {
    const particles = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
        id: i,
        size: Math.random() * 2 + 1,
        x: Math.random() * 100,
        y: Math.random() * 100,
        duration: Math.random() * 20 + 10,
        delay: Math.random() * 5
    })), []);

    const color = risk > 50 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.3)';

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            {particles.map(p => (
                <motion.div
                    key={p.id}
                    animate={{
                        y: ['0vh', '100vh'],
                        x: [`${p.x}vw`, `${p.x + (Math.random() * 10 - 5)}vw`],
                        opacity: [0, 1, 0]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear"
                    }}
                    className="absolute rounded-full"
                    style={{
                        width: p.size,
                        height: p.size,
                        left: `${p.x}vw`,
                        top: '-5vh',
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}`
                    }}
                />
            ))}
            <svg className="absolute inset-0 w-full h-full opacity-5">
                <defs>
                    <pattern id="nexus-grid" width="100" height="100" patternUnits="userSpaceOnUse">
                        <path d="M 100 0 L 0 0 0 100" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white/20" />
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#nexus-grid)" />
            </svg>
        </div>
    );
};

const DiagnosticTerminal = ({ logs }) => {
    const scrollRef = useRef(null);
    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [logs]);

    return (
        <div className="mt-8 bg-black/60 rounded-2xl border border-white/5 p-4 font-mono text-[9px] overflow-hidden shadow-inner">
            <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                <Terminal size={12} className="text-blue-500" />
                <span className="text-slate-500 uppercase tracking-widest font-black">SENTINEL_DIAGNOSTIC_STREAMS</span>
            </div>
            <div ref={scrollRef} className="h-24 overflow-y-auto custom-scrollbar space-y-1 pr-2">
                {logs.map((log, i) => (
                    <div key={i} className="flex gap-3">
                        <span className="text-blue-500/50">[{new Date().toLocaleTimeString()}]</span>
                        <span className={log.type === 'err' ? 'text-red-400' : log.type === 'warn' ? 'text-orange-400' : 'text-slate-400'}>
                            {log.msg}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const TelemetryBadge = ({ label, value, x, y, icon: Icon }) => (
    <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ left: `${x}%`, top: `${y}%` }}
        className="absolute z-20 group"
    >
        <div className="relative">
            <div className="absolute inset-0 bg-blue-500/10 blur-md rounded-full" />
            <div className="relative bg-black/90 border border-white/10 px-3 py-1.5 rounded-xl flex items-center gap-2 backdrop-blur-md cursor-help hover:border-blue-500 transition-colors">
                {Icon && <Icon size={10} className="text-blue-400" />}
                <span className="text-[8px] font-black text-white/40 uppercase tracking-tighter whitespace-nowrap">{label}</span>
                <span className="text-[10px] font-bold text-white font-mono">{value}</span>
            </div>
        </div>
    </motion.div>
);

const SentinelChat = ({ currentStats }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Mnemonic link established. I am Sentinel AI. How can I assist with your hardware diagnostics today?" }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const chatRef = useRef(null);

    useEffect(() => {
        if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const res = await axios.post(CHAT_URL, {
                message: userMsg,
                current_stats: currentStats
            });
            setMessages(prev => [...prev, { role: 'assistant', content: res.data.response }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'assistant', content: "Neural sync failed. Backend offline." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 sm:bottom-12 sm:right-12 z-[200]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        className="fixed inset-0 sm:absolute sm:inset-auto sm:bottom-24 sm:right-0 w-full h-full sm:w-[400px] sm:h-[550px] bg-[#0a0a0b]/95 sm:bg-[#0a0a0b]/90 backdrop-blur-3xl border-t sm:border border-white/10 sm:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
                    >
                        <div className="p-6 sm:p-8 border-b border-white/5 flex justify-between items-center bg-blue-600/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2 sm:p-3 bg-blue-600 rounded-xl sm:rounded-2xl">
                                    <Bot size={18} className="text-white" />
                                </div>
                                <div>
                                    <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest italic">Sentinel AI</h4>
                                    <p className="text-[8px] sm:text-[9px] text-blue-400 font-bold uppercase tracking-widest animate-pulse">Core Linked</p>
                                </div>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div ref={chatRef} className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 custom-scrollbar">
                            {messages.map((m, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, x: m.role === 'user' ? 10 : -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[90%] sm:max-w-[85%] p-4 sm:p-5 rounded-2xl sm:rounded-3xl text-[11px] sm:text-xs leading-relaxed ${m.role === 'user' ? 'bg-blue-600 text-white font-bold' : 'bg-white/5 text-slate-300 border border-white/5'}`}>
                                        {m.content}
                                    </div>
                                </motion.div>
                            ))}
                            {loading && (
                                <div className="flex justify-start">
                                    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex gap-2">
                                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full animate-bounce" />
                                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full animate-bounce delay-75" />
                                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-blue-500 rounded-full animate-bounce delay-150" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSend} className="p-6 sm:p-8 bg-black/40 border-t border-white/5 mb-safe">
                            <div className="flex gap-4">
                                <input
                                    type="text" value={input} onChange={e => setInput(e.target.value)}
                                    placeholder="COMMAND SENTINEL..."
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-3 sm:py-4 px-4 sm:px-6 text-[10px] font-black uppercase tracking-widest text-white focus:outline-none focus:border-blue-500 transition-colors"
                                />
                                <button type="submit" className="p-3 sm:p-4 bg-blue-600 text-white rounded-xl sm:rounded-2xl hover:bg-blue-500 transition-all">
                                    <Send size={18} />
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isOpen && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-600 rounded-full shadow-2xl shadow-blue-600/40 flex items-center justify-center text-white relative group"
                >
                    <div className="absolute inset-0 bg-blue-600 rounded-full blur-xl opacity-50 group-hover:opacity-80 transition-opacity" />
                    <Bot size={24} className="relative z-10 sm:hidden" />
                    <Bot size={28} className="relative z-10 hidden sm:block" />
                </motion.button>
            )}
        </div>
    );
};

const GlassCard = ({ children, className = "" }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`backdrop-blur-xl bg-white/[0.03] border border-white/10 rounded-3xl shadow-2xl ${className}`}
    >
        {children}
    </motion.div>
);

const SectionTitle = ({ children, icon: Icon, subtitle }) => (
    <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
            {Icon && <Icon className="text-blue-500" size={24} />}
            <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic">{children}</h2>
        </div>
        {subtitle && <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em] ml-9">{subtitle}</p>}
    </div>
);

const LoaderPulse = () => (
    <div className="flex flex-col items-center justify-center p-20 gap-6">
        <div className="relative">
            <motion.div
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute inset-0 bg-blue-500 rounded-full blur-3xl"
            />
            <Loader2 className="animate-spin text-blue-500 relative z-10" size={64} />
        </div>
        <div className="text-center">
            <p className="text-xl font-black text-white italic uppercase tracking-tighter mb-1">Inference in Progress</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">Running RandomForest_V4.2 Weights...</p>
        </div>
    </div>
);

// --- Sections ---

const Hero = ({ onScrollToChecker, metrics }) => {
    return (
        <section className="relative min-h-screen flex flex-col items-center pt-32 pb-16 px-6 sm:px-8 lg:px-24 overflow-hidden">
            {/* Background Glows */}
            <div className="absolute top-1/4 -left-20 w-72 h-72 sm:w-96 sm:h-96 bg-blue-600/20 blur-[120px] rounded-full" />
            <div className="absolute bottom-1/4 -right-20 w-72 h-72 sm:w-96 sm:h-96 bg-purple-600/10 blur-[120px] rounded-full" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center z-10 w-full">
                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.8 }}
                    className="space-y-6 sm:space-y-8 text-center lg:text-left"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest">
                        <Activity size={12} /> Next-Generation Intelligence
                    </div>
                    <h1 className="text-3xl sm:text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.95] italic uppercase text-glow">
                        Master the <br /> <span className="text-blue-500">Machine</span> Soul.
                    </h1>
                    <p className="text-slate-400 text-sm sm:text-lg max-w-xl mx-auto lg:mx-0 font-medium leading-relaxed">
                        Industry 4.0 diagnostics powered by advanced ensemble learning. Predict failures before they happen, optimize your uptime, and engineer with certainty.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                        <button
                            onClick={onScrollToChecker}
                            className="w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 group"
                        >
                            Start Diagnostic <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="relative w-full max-w-[320px] sm:max-w-lg mx-auto"
                >
                    <div className="relative aspect-square">
                        {/* Interactive Badges */}
                        <TelemetryBadge label="LIVE_RPM" value={`${metrics.rotational_speed || 1550}`} x={10} y={20} icon={Zap} />
                        <TelemetryBadge label="CORE_HEAT" value={`${metrics.proc_temp_c || 35}°`} x={75} y={30} icon={Thermometer} />
                        <TelemetryBadge label="STRESS" value={`${metrics.torque || 42}Nm`} x={15} y={75} icon={Activity} />

                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 to-purple-600/30 rounded-full blur-[80px] opacity-50 pulse" />
                        <div className="relative border border-white/10 rounded-[3rem] sm:rounded-[4rem] h-full w-full backdrop-blur-3xl p-6 sm:p-8 flex items-center justify-center overflow-hidden group">
                            <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px] sm:bg-[size:40px_40px]" />
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
                                className="relative z-10"
                            >
                                <Cpu size={180} className="text-white/10 sm:hidden" strokeWidth={0.5} />
                                <Cpu size={240} className="text-white/10 hidden sm:block" strokeWidth={0.5} />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Settings size={80} className="text-blue-500/40 animate-spin-slow sm:hidden" />
                                    <Settings size={120} className="text-blue-500/40 animate-spin-slow hidden sm:block" />
                                </div>
                            </motion.div>
                            <div className="absolute bottom-6 right-6 sm:bottom-12 sm:right-12 p-3 sm:p-6 bg-black/60 rounded-2xl sm:rounded-3xl border border-white/10 backdrop-blur-xl">
                                <div className="flex gap-2 sm:gap-4 items-center">
                                    <ShieldCheck className="text-emerald-400" size={16} />
                                    <div>
                                        <p className="text-[8px] sm:text-[10px] font-black text-white uppercase tracking-widest">Sentinel Core</p>
                                        <p className="text-[8px] sm:text-[10px] text-slate-500 font-bold">V12.0 Active</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute bottom-6 sm:bottom-12 left-1/2 -translate-x-1/2 text-slate-600"
            >
                <ChevronDown size={24} />
            </motion.div>
        </section>
    );
};

const AboutUs = () => {
    return (
        <section className="py-32 px-8 lg:px-24">
            <SectionTitle subtitle="Integrity in engineering">The Sentinel ML Philosophy</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { title: "AI Engineering", desc: "Our models are trained on real-world industrial datasets with 10k+ telemetry signatures for extreme precision.", icon: Microscope },
                    { title: "Real-time Metrics", desc: "Edge-compatible inference engines that deliver millisecond response times for critical hardware states.", icon: Activity },
                    { title: "Actionable Insights", desc: "We don't just show data; we provide clear engineering directives for maintenance and repair.", icon: Wrench }
                ].map((f, i) => (
                    <GlassCard key={i} className="p-10 border-white/5 hover:border-blue-500/30 transition-colors group">
                        <f.icon className="text-blue-500 mb-6 group-hover:scale-110 transition-transform" size={40} />
                        <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-4">{f.title}</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
                    </GlassCard>
                ))}
            </div>

            <div className="mt-20 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-8">
                    <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase">Why Choose <span className="text-blue-500">Sentinel</span>?</h2>
                    <div className="space-y-6">
                        {[
                            "99.8% Failure Prediction Accuracy",
                            "Ensemble Learning Architecture",
                            "Cross-Industry Compatibility (L, M, H Sensors)",
                            "Zero-Latency Local Inference"
                        ].map((t, i) => (
                            <div key={i} className="flex gap-4 items-center">
                                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle2 size={14} className="text-emerald-500" />
                                </div>
                                <span className="text-slate-300 font-bold uppercase text-xs tracking-widest">{t}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="p-1 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20">
                    <div className="bg-[#050506] rounded-[1.4rem] p-10 space-y-8">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Benchmarking</span>
                            <BarChart3 className="text-blue-500" size={16} />
                        </div>
                        <div className="space-y-6">
                            {[75, 92, 60, 88].map((v, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            whileInView={{ width: `${v}%` }}
                                            className="h-full bg-blue-600"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const HelpPage = () => {
    return (
        <section className="py-32 px-8 lg:px-24 bg-white/[0.01]">
            <SectionTitle subtitle="Operational Workflow">How to Use the Checker</SectionTitle>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {[
                    { step: "01", title: "Select Unit", desc: "Choose your machine type (Standard, Industrial, or Heavy-Duty) to calibrate model sensitivity.", icon: Box },
                    { step: "02", title: "Input Specs", desc: "Enter your current sensor telemetries manually into the secure diagnostic form.", icon: Terminal },
                    { step: "03", title: "Run Analysis", desc: "Initiate the AI inference kernel to process feature correlations and risk vectors.", icon: Play },
                    { step: "04", title: "Execute Maintenance", desc: "Follow the engineering directives and maintenance tips to secure your asset.", icon: ShieldCheck }
                ].map((s, i) => (
                    <div key={i} className="relative p-8 rounded-3xl bg-white/5 border border-white/5 group hover:bg-white/10 transition-all">
                        <span className="text-6xl font-black text-white/5 absolute top-4 right-4 group-hover:text-blue-500/10 transition-colors font-mono">{s.step}</span>
                        <s.icon className="text-blue-500 mb-6" size={24} />
                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2 italic">{s.title}</h4>
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed uppercase">{s.desc}</p>
                    </div>
                ))}
            </div>
        </section>
    );
};

const DataExplorer = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const rowsPerPage = 10;

    const fetchHistory = useCallback(() => {
        setLoading(true);
        axios.get(HISTORY_URL).then(res => {
            if (res.data.status === 'success') {
                setData(res.data.data || []);
            }
            setLoading(false);
        }).catch(err => {
            console.error("History fetch error:", err);
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const filteredData = useMemo(() => {
        if (!data) return [];
        const term = searchTerm.toLowerCase();
        return data.filter(row =>
            Object.values(row).some(val =>
                (val?.toString() || "").toLowerCase().includes(term)
            )
        );
    }, [data, searchTerm]);

    const paginatedData = filteredData.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

    return (
        <section id="dataset" className="py-24 sm:py-32 px-6 sm:px-8 lg:px-24">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 sm:mb-12 gap-6 sm:gap-8">
                <div>
                    <SectionTitle subtitle="Evidence-based intelligence">Historical Data Miner</SectionTitle>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
                    <button
                        onClick={fetchHistory}
                        className="p-3 sm:p-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-slate-500 hover:text-blue-500 hover:border-blue-500/50 transition-all"
                        title="Refresh Dataset"
                    >
                        <Loader2 className={loading ? "animate-spin" : ""} size={18} />
                    </button>
                    <div className="relative flex-1 lg:w-96">
                        <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input
                            type="text" placeholder="QUERY DATA UNIVERSE..."
                            value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(0); }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-4 sm:py-5 pl-12 sm:pl-14 pr-6 sm:pr-8 text-[10px] sm:text-xs font-black uppercase tracking-widest focus:outline-none focus:border-blue-500 transition-colors text-white"
                        />
                    </div>
                </div>
            </div>

            <GlassCard className="overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/10">
                                {['UDI', 'Type', 'Speed', 'Torque', 'Process', 'Air', 'Status'].map(h => (
                                    <th key={h} className="px-6 sm:px-8 py-5 sm:py-6 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-[10px] sm:text-[11px] font-bold">
                            {loading ? (
                                <tr><td colSpan="7" className="px-8 py-20 text-center text-slate-600 animate-pulse italic uppercase tracking-widest font-black">Syncing Dataset...</td></tr>
                            ) : paginatedData.map((row, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 sm:px-8 py-5 sm:py-6 text-slate-500 font-mono">#{row.UDI}</td>
                                    <td className="px-6 sm:px-8 py-5 sm:py-6"><span className="px-2 sm:px-3 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">{row.Type}</span></td>
                                    <td className="px-6 sm:px-8 py-5 sm:py-6 text-slate-300 font-mono italic">{row['Rotational speed [rpm]']}</td>
                                    <td className="px-6 sm:px-8 py-5 sm:py-6 text-slate-300 font-mono italic">{row['Torque [Nm]']}</td>
                                    <td className="px-6 sm:px-8 py-5 sm:py-6 text-slate-300 font-mono">{row['Process temperature [K]']}K</td>
                                    <td className="px-6 sm:px-8 py-5 sm:py-6 text-slate-300 font-mono">{row['Air temperature [K]']}K</td>
                                    <td className="px-6 sm:px-8 py-5 sm:py-6">
                                        {row['Target'] ? (
                                            <span className="text-red-500 bg-red-500/10 px-2 sm:px-3 py-1 rounded-lg font-black tracking-tighter uppercase italic">{row['Failure Type'] || 'ALARM'}</span>
                                        ) : (
                                            <span className="text-emerald-500/40 uppercase tracking-widest">Nominal</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="p-6 sm:p-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0">
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest">Showing {paginatedData.length} of {filteredData.length} records</p>
                    <div className="flex gap-4">
                        <button
                            disabled={page === 0}
                            onClick={() => setPage(p => p - 1)}
                            className="w-10 h-10 border border-white/5 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:border-blue-500 disabled:opacity-20 transition-all"
                        >
                            <ChevronRight className="rotate-180" size={16} />
                        </button>
                        <button
                            disabled={(page + 1) * rowsPerPage >= filteredData.length}
                            onClick={() => setPage(p => p + 1)}
                            className="w-10 h-10 border border-white/5 rounded-xl flex items-center justify-center text-slate-500 hover:text-white hover:border-blue-500 disabled:opacity-20 transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </GlassCard>
        </section>
    );
};

const Footer = () => {
    return (
        <footer className="pt-32 pb-12 px-8 lg:px-24 border-t border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                <div className="col-span-1 md:col-span-2 space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-white shadow-lg text-sm">AI</div>
                        <span className="text-2xl font-black tracking-tighter text-white uppercase italic">SENTINEL<span className="text-blue-500">_CORE</span></span>
                    </div>
                    <p className="text-slate-500 text-sm max-w-sm font-medium leading-relaxed">
                        The ultimate diagnostic bridge between industrial hardware and ensemble neural networks. Engineering the future of zero-downtime manufacturing.
                    </p>
                    <div className="flex gap-6">
                        <Twitter size={20} className="text-slate-600 hover:text-blue-400 cursor-pointer transition-colors" />
                        <a href="https://github.com/muhaddasgujjar/SENTINEL_ML" target="_blank" rel="noopener noreferrer">
                            <Github size={20} className="text-slate-600 hover:text-white cursor-pointer transition-colors" />
                        </a>
                        <Mail size={20} className="text-slate-600 hover:text-red-400 cursor-pointer transition-colors" />
                    </div>
                </div>
                <div className="space-y-6">
                    <h5 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Engineering</h5>
                    <ul className="space-y-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <li className="hover:text-white cursor-pointer transition-colors">Documentation</li>
                        <li className="hover:text-white cursor-pointer transition-colors">API Reference</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Model Hub</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Dataset Miner</li>
                    </ul>
                </div>
                <div className="space-y-6">
                    <h5 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Contact</h5>
                    <ul className="space-y-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                        <li className="hover:text-white cursor-pointer transition-colors">Support Portal</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Hardware Sync</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Safety Officer</li>
                        <li className="hover:text-white cursor-pointer transition-colors">Privacy</li>
                    </ul>
                </div>
            </div>
            <div className="flex justify-between items-center pt-12 border-t border-white/5 text-[9px] font-black text-slate-700 uppercase tracking-widest">
                <p>&copy; 2026 Sentinel ML Diagnostics. All Rights Reserved.</p>
                <p>Build: V12.0.42_STABLE</p>
            </div>
        </footer>
    );
};

// --- MAIN APP ---

export default function App() {
    const [checkerData, setCheckerData] = useState({
        machine_type: 'L',
        rotational_speed: '',
        torque: '',
        proc_temp_c: '',
        air_temp_c: 25,
        tool_wear: 0
    });

    const [processing, setProcessing] = useState(false);
    const [results, setResults] = useState(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [logs, setLogs] = useState([
        { msg: "SENTINEL Diagnostic Engine initialized...", type: "info" },
        { msg: "Awaiting hardware telemetry handshake...", type: "warn" }
    ]);
    const checkerRef = useRef(null);

    const addLog = (msg, type = "info") => setLogs(p => [...p.slice(-15), { msg, type }]);

    const handleCheck = async (e) => {
        e.preventDefault();
        setProcessing(true);
        setResults(null);
        addLog("Initiating hardware sensor ingestion...", "info");

        try {
            const payload = {
                ...checkerData,
                rotational_speed: parseFloat(checkerData.rotational_speed),
                torque: parseFloat(checkerData.torque),
                proc_temperature: cToK(checkerData.proc_temp_c),
                air_temperature: cToK(checkerData.air_temp_c),
                tool_wear: parseFloat(checkerData.tool_wear)
            };

            setTimeout(() => addLog("Mapping engineered features: Power_W, TempDelta...", "info"), 400);
            setTimeout(() => addLog("Executing RandomForest inference kernel...", "info"), 800);

            const response = await axios.post(API_URL, payload);

            setTimeout(() => {
                setResults(response.data);
                const risk = response.data.max_risk;
                addLog(`Analysis complete. Risk Vector: ${risk.toFixed(1)}%`, risk > 50 ? "err" : "info");
                setProcessing(false);
            }, 1200);
        } catch (e) {
            addLog("Mnemonic Kernel Fault: Prediction failure.", "err");
            console.error(e);
            setProcessing(false);
        }
    };

    const scrollToChecker = () => {
        checkerRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const isCritical = results ? results.max_risk > 50 : false;

    return (
        <div className="bg-[#050506] text-white selection:bg-blue-500/30 font-sans overflow-x-hidden relative">
            <NeuralNexus risk={results?.max_risk || 0} />

            {/* Header / Nav */}
            <header className="fixed top-0 left-0 right-0 h-20 sm:h-24 border-b border-white/5 bg-[#050506]/80 backdrop-blur-xl z-[150] px-6 sm:px-8 lg:px-24 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-black text-white text-xs">AI</div>
                    <span className="text-lg sm:text-xl font-black tracking-tighter text-white uppercase italic">SENTINEL<span className="text-blue-500">_ML</span></span>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex gap-10 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    <a href="#" className="hover:text-blue-500 transition-colors">Home</a>
                    <a href="#about" className="hover:text-blue-500 transition-colors">Intelligence</a>
                    <a href="#checker" className="hover:text-blue-500 transition-colors">Checker</a>
                    <a href="#dataset" className="hover:text-blue-500 transition-colors">Data</a>
                </nav>

                <div className="flex items-center gap-4">
                    <button
                        onClick={scrollToChecker}
                        className="hidden sm:block px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                        Quick Check
                    </button>

                    {/* Mobile Menu Toggle */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-3 bg-white/5 rounded-xl border border-white/10 text-white"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <LayoutDashboard size={20} />}
                    </button>
                </div>

                {/* Mobile Menu Overlay */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="absolute top-24 left-0 right-0 bg-[#0a0a0b] border-b border-white/10 p-8 flex flex-col items-center gap-6 lg:hidden z-[140] shadow-2xl backdrop-blur-3xl"
                        >
                            {['Home', 'Intelligence', 'Checker', 'Data'].map((item, i) => {
                                const hrefs = { Home: '#', Intelligence: '#about', Checker: '#checker', Data: '#dataset' };
                                return (
                                    <a
                                        key={i}
                                        href={hrefs[item]}
                                        onClick={() => setMobileMenuOpen(false)}
                                        className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 hover:text-blue-500 transition-colors w-full text-center py-4 border-b border-white/5 last:border-none"
                                    >
                                        {item === 'Home' ? 'Terminal' : item}
                                    </a>
                                );
                            })}
                            <button
                                onClick={() => { setMobileMenuOpen(false); scrollToChecker(); }}
                                className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px]"
                            >
                                Start Diagnostic Scan
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <Hero onScrollToChecker={scrollToChecker} metrics={checkerData} />

            <div id="about">
                <AboutUs />
            </div>

            <HelpPage />

            {/* CORE CHECKER SECTION */}
            <section id="checker" ref={checkerRef} className="py-24 sm:py-32 px-6 sm:px-8 lg:px-24 relative">
                {isCritical && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-red-950/20 blur-[120px] -z-10"
                    />
                )}

                <SectionTitle subtitle="Neural Diagnostic Kernel">Hardware Maintenance Checker</SectionTitle>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
                    {/* INPUT FORM */}
                    <GlassCard className="p-6 sm:p-10 border-blue-500/10">
                        <SectionTitle icon={Settings} className="!mb-6 sm:!mb-8 !text-xs italic">Manual Input Matrix</SectionTitle>
                        <form onSubmit={handleCheck} className="space-y-6 sm:space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Machine Type</label>
                                    <div className="flex gap-2">
                                        {['L', 'M', 'H'].map(t => (
                                            <button
                                                key={t} type="button"
                                                onClick={() => setCheckerData(p => ({ ...p, machine_type: t }))}
                                                className={`flex-1 py-3 rounded-xl border text-[10px] font-black transition-all ${checkerData.machine_type === t ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Speed (RPM)</label>
                                    <input
                                        type="number" required placeholder="E.g. 1550"
                                        value={checkerData.rotational_speed}
                                        onChange={e => setCheckerData(p => ({ ...p, rotational_speed: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl sm:rounded-2xl p-4 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Load (Nm)</label>
                                    <input
                                        type="number" step="0.1" required placeholder="E.g. 42.5"
                                        value={checkerData.torque}
                                        onChange={e => setCheckerData(p => ({ ...p, torque: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl sm:rounded-2xl p-4 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Core Heat (°C)</label>
                                    <input
                                        type="number" step="0.1" required placeholder="E.g. 35.8"
                                        value={checkerData.proc_temp_c}
                                        onChange={e => setCheckerData(p => ({ ...p, proc_temp_c: e.target.value }))}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl sm:rounded-2xl p-4 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-blue-500 transition-all font-mono"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit" disabled={processing}
                                className="w-full py-5 sm:py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-lg shadow-blue-600/20"
                            >
                                {processing ? <Loader2 className="animate-spin" size={16} /> : <ShieldAlert size={18} />}
                                {processing ? 'Synthesizing...' : 'Start Global Diagnostics'}
                            </button>
                        </form>
                        <DiagnosticTerminal logs={logs} />
                    </GlassCard>

                    {/* RESULTS AREA */}
                    <div className="min-h-[400px] sm:min-h-[500px]">
                        <AnimatePresence mode="wait">
                            {processing ? (
                                <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
                                    <GlassCard className="h-full flex items-center justify-center">
                                        <LoaderPulse />
                                    </GlassCard>
                                </motion.div>
                            ) : results ? (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6 sm:space-y-8"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
                                        <GlassCard className={`p-6 border-2 transition-all ${results.max_risk > 50 ? 'border-red-500/50 bg-red-500/5 shadow-[0_0_50px_rgba(239,68,68,0.2)]' : 'border-emerald-500/30'}`}>
                                            <div className="flex flex-col items-center justify-center pt-2 sm:pt-4">
                                                <div className="w-24 h-24 sm:w-32 sm:h-32 relative">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <PieChart>
                                                            <Pie
                                                                data={[{ v: 100 - results.max_risk }, { v: results.max_risk }]}
                                                                innerRadius={35} outerRadius={45} startAngle={90} endAngle={-270} dataKey="v" stroke="none"
                                                            >
                                                                <Cell fill={results.max_risk > 50 ? '#ef4444' : '#10b981'} />
                                                                <Cell fill="rgba(255,255,255,0.05)" />
                                                            </Pie>
                                                        </PieChart>
                                                    </ResponsiveContainer>
                                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                                        <span className={`text-xl sm:text-2xl font-black ${results.max_risk > 50 ? 'text-red-500' : 'text-emerald-400'}`}>{Math.round(100 - results.max_risk)}%</span>
                                                        <span className="text-[7px] sm:text-[8px] font-black text-slate-600 uppercase">Health</span>
                                                    </div>
                                                </div>
                                                <h4 className={`mt-4 sm:mt-6 text-[10px] sm:text-sm font-black uppercase tracking-widest text-center ${results.max_risk > 50 ? 'text-red-500' : 'text-emerald-400'}`}>
                                                    {results.max_risk > 50 ? 'Critical Risk Detected' : 'Safety Confirmed'}
                                                </h4>
                                            </div>
                                        </GlassCard>
                                        <GlassCard className="p-6">
                                            <SectionTitle icon={BarChart3} className="!mb-2 sm:!mb-4 !text-[10px] sm:!text-xs">Risk Profiling</SectionTitle>
                                            <div className="h-[150px] sm:h-[180px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                                                        { s: 'W', v: results.predictions.TWF },
                                                        { s: 'H', v: results.predictions.HDF },
                                                        { s: 'P', v: results.predictions.PWF },
                                                        { s: 'S', v: results.predictions.OSF },
                                                        { s: 'R', v: results.predictions.RNF },
                                                    ]}>
                                                        <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                                        <PolarAngleAxis dataKey="s" tick={{ fill: '#475569', fontSize: 8, fontWeight: 'bold' }} />
                                                        <Radar dataKey="v" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </GlassCard>
                                    </div>

                                    <motion.div
                                        initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                                        className={`p-6 sm:p-8 rounded-3xl border-2 transition-all ${results.max_risk > 50 ? 'bg-red-500 border-red-400 text-white' : 'bg-emerald-500/10 border-emerald-500/30'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4 sm:mb-6">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <Lightbulb size={20} className={results.max_risk > 50 ? 'text-white' : 'text-blue-500'} />
                                                <h4 className="text-lg sm:text-xl font-black uppercase tracking-tighter italic">Engineered Maintenance Tips</h4>
                                            </div>
                                            <Wrench size={20} className="opacity-30" />
                                        </div>
                                        <div className="space-y-4 sm:space-y-6">
                                            {results.ai_recommendations.map((rec, i) => (
                                                <div key={i} className="space-y-1 sm:space-y-2">
                                                    <p className="text-[11px] sm:text-sm font-black italic leading-tight underline underline-offset-4 decoration-white/20">{rec.en}</p>
                                                    <p className="text-lg sm:text-2xl font-bold dir-rtl overflow-hidden text-ellipsis" style={{ direction: 'rtl' }}>{rec.ur}</p>
                                                </div>
                                            ))}
                                            {results.max_risk > 50 && (
                                                <div className="bg-white/10 p-3 sm:p-4 rounded-xl border border-white/20 text-[8px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-3 sm:gap-4">
                                                    <AlertTriangle className="animate-pulse flex-shrink-0" size={20} />
                                                    <span>Immediate Hardware Interaction Required to prevent critical structural damage.</span>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                </motion.div>
                            ) : (
                                <GlassCard className="h-full flex items-center justify-center p-12 text-center border-dashed border-white/10 group">
                                    <div className="space-y-6">
                                        <Compass size={64} className="mx-auto text-slate-800 group-hover:text-blue-500/40 transition-colors" />
                                        <div>
                                            <p className="text-base font-black text-slate-600 uppercase tracking-widest italic">Diagnostic Terminal Ready</p>
                                            <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest mt-2">Awaiting sensor data sequence for global audit.</p>
                                        </div>
                                    </div>
                                </GlassCard>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </section>

            <div id="dataset">
                <DataExplorer />
            </div>

            <Footer />

            <SentinelChat currentStats={checkerData} />

            <style>{`
                html { 
                    scroll-behavior: smooth;
                    overflow-y: auto;
                    overflow-x: hidden;
                }
                body {
                    margin: 0;
                    padding: 0;
                    overflow-x: hidden;
                    background: #050506;
                }
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: #050506; }
                ::-webkit-scrollbar-thumb { background: #222; border-radius: 10px; }
                ::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
                .animate-spin-slow { animation: spin 8s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .bg-grid-white { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='white' stroke-opacity='0.1'%3E%3Cpath d='M0 .5H31.5V32'/%3E%3C/svg%3E"); }
                .dir-rtl { direction: rtl; unicode-bidi: bidi-override; text-align: right; }
                .text-glow { text-shadow: 0 0 30px rgba(59, 130, 246, 0.3); }
                .pulse { animation: pulseBg 4s infinite; }
                @keyframes pulseBg { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
                .custom-scrollbar::-webkit-scrollbar { width: 3px; }
                .mb-safe { padding-bottom: env(safe-area-inset-bottom); }
            `}</style>
        </div>
    );
}
