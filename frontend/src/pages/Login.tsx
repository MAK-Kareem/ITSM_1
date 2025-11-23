import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, Variants } from "framer-motion";
import authService from '../services/auth.service';
import {
    // General & Auth
    Lock, User, Eye, EyeOff, X, HelpCircle, Clock,
    // Asset Management
    Server, Laptop, HardDrive, Smartphone,
    // Incident Management
    Siren, ShieldAlert, Bug, Wrench,
    // SIM Management
    Signal, Wifi, TowerControl, Router,
    // Change Management
    GitPullRequest, Package, GitBranchPlus, ClipboardCheck,
    // Helpdesk
    Headset, PhoneCall, LifeBuoy, MessageSquarePlus,
    // Document Management
    FileText, FolderArchive, Printer, ScanLine,
    // HR Management
    Users, Calendar, Briefcase, UserCog,
    // NOC Monitoring
    Monitor, Activity, Network, Database,
    // Policy Management
    Shield, BookOpen, Gavel, Scale,
    // Hub/Payments
    CreditCard, Landmark, Receipt, Banknote,
    // Existing Icons (for stats)
    AlertTriangle, Ticket, Settings, FileCheck, UserCheck, BarChart3,
    // Additional modern icons
    Sparkles, Zap, Star, ArrowRight, TrendingUp, Award
} from "lucide-react";

// ==================== VISUAL STUDIO INSPIRED BACKGROUND ====================
const VSCodeBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationFrameIdRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // Floating orbs configuration
        const orbs: Array<{
            x: number;
            y: number;
            radius: number;
            vx: number;
            vy: number;
            color: string;
            opacity: number;
        }> = [];

        const colors = [
            'rgba(99, 102, 241, 0.15)',   // Indigo
            'rgba(139, 92, 246, 0.15)',   // Purple
            'rgba(236, 72, 153, 0.15)',   // Pink
            'rgba(59, 130, 246, 0.15)',   // Blue
            'rgba(14, 165, 233, 0.15)',   // Sky
        ];

        // Create floating orbs
        for (let i = 0; i < 8; i++) {
            orbs.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 200 + 100,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                color: colors[Math.floor(Math.random() * colors.length)],
                opacity: Math.random() * 0.3 + 0.1
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw and update orbs
            orbs.forEach(orb => {
                // Update position
                orb.x += orb.vx;
                orb.y += orb.vy;

                // Bounce off edges
                if (orb.x < -orb.radius || orb.x > canvas.width + orb.radius) orb.vx *= -1;
                if (orb.y < -orb.radius || orb.y > canvas.height + orb.radius) orb.vy *= -1;

                // Create gradient
                const gradient = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.radius);
                gradient.addColorStop(0, orb.color.replace('0.15', String(orb.opacity)));
                gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

                // Draw orb
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameIdRef.current = requestAnimationFrame(animate);
        };

        animate();

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Gradient background inspired by VS Code */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900" />

            {/* Animated canvas with floating orbs */}
            <canvas ref={canvasRef} className="absolute inset-0 z-10" />

            {/* Grid overlay */}
            <div className="absolute inset-0 z-20 opacity-10" style={{
                backgroundImage: `
                    linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
                `,
                backgroundSize: '50px 50px'
            }} />

            {/* Radial gradient overlay */}
            <div className="absolute inset-0 z-30 bg-gradient-radial from-transparent via-transparent to-slate-900/50" />
        </div>
    );
};

// ==================== FLOATING GEOMETRIC SHAPES ====================
const FloatingShapes = () => {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Floating hexagons */}
            {[...Array(6)].map((_, i) => (
                <motion.div
                    key={`hex-${i}`}
                    className="absolute pointer-events-none"
                    style={{
                        left: `${10 + i * 15}%`,
                        top: `${20 + (i % 3) * 25}%`,
                    }}
                    animate={{
                        y: [0, -30, 0],
                        rotate: [0, 180, 360],
                        opacity: [0.1, 0.3, 0.1],
                    }}
                    transition={{
                        duration: 8 + i * 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.5,
                    }}
                >
                    <svg width="60" height="60" viewBox="0 0 60 60">
                        <polygon
                            points="30,5 55,17.5 55,42.5 30,55 5,42.5 5,17.5"
                            fill="none"
                            stroke="rgba(139, 92, 246, 0.3)"
                            strokeWidth="2"
                        />
                    </svg>
                </motion.div>
            ))}

            {/* Floating circles */}
            {[...Array(8)].map((_, i) => (
                <motion.div
                    key={`circle-${i}`}
                    className="absolute w-3 h-3 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 pointer-events-none"
                    style={{
                        left: `${5 + i * 12}%`,
                        top: `${15 + (i % 4) * 20}%`,
                    }}
                    animate={{
                        y: [0, -50, 0],
                        x: [0, 20, 0],
                        scale: [1, 1.5, 1],
                        opacity: [0.2, 0.6, 0.2],
                    }}
                    transition={{
                        duration: 6 + i,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.3,
                    }}
                />
            ))}

            {/* Floating lines */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={`line-${i}`}
                    className="absolute h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent pointer-events-none"
                    style={{
                        left: 0,
                        right: 0,
                        top: `${20 + i * 15}%`,
                        width: '100%',
                    }}
                    animate={{
                        opacity: [0, 0.3, 0],
                        scaleX: [0.5, 1, 0.5],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: i * 0.8,
                    }}
                />
            ))}
        </div>
    );
};

const TimeDisplay = ({ time }: { time: Date }) => {
  const formatFullDateTime = (date: Date): string => {
    const day = date.getDate();
    let suffix = 'th';
    if (day % 10 === 1 && day !== 11) suffix = 'st';
    else if (day % 10 === 2 && day !== 12) suffix = 'nd';
    else if (day % 10 === 3 && day !== 13) suffix = 'rd';

    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    };

    const datePart = date.toLocaleDateString('en-US', options);
    const timePart = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    let formattedString = datePart.replace(`, ${day},`, ` ${day}${suffix},`);
    if (!formattedString.includes(suffix)) {
        formattedString = datePart.replace(`${day}`, `${day}${suffix}`);
    }

    return formattedString + ' ' + timePart;
  };

  return (
    <motion.div
        className="absolute top-6 left-6 z-40 flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-2xl px-5 py-3 border border-white/20 shadow-xl pointer-events-none"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <Clock size={18} className="text-purple-300" />
        <p className="text-sm font-semibold text-white tracking-wide">{formatFullDateTime(time)}</p>
    </motion.div>
  );
};

// ==================== ENHANCED ICON GRID COMPONENT ====================
const ModernIconGrid = ({ icons, color, accentColor }: {
  icons: React.ElementType[],
  color: string,
  accentColor: string
}) => {
    return (
        <div className="w-5/12 bg-gradient-to-br from-slate-800/40 to-slate-900/40 backdrop-blur-xl grid grid-cols-2 grid-rows-2 gap-8 p-8 place-items-center rounded-r-3xl border border-white/10 shadow-2xl">
            {icons.map((Icon, i) => (
                <motion.div
                    key={i}
                    className="relative group"
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        delay: 0.5 + i * 0.15,
                        duration: 0.8,
                        ease: "easeOut",
                        type: "spring",
                        stiffness: 100
                    }}
                    whileHover={{
                        scale: 1.1,
                        transition: { duration: 0.2 }
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-300 backdrop-blur-sm" />
                    <div className="relative p-6 flex items-center justify-center">
                        <Icon
                            size={80}
                            strokeWidth={1.5}
                            className="transition-all duration-300 group-hover:scale-110 drop-shadow-lg"
                            style={{ color: color }}
                        />
                        <motion.div
                            className="absolute inset-0 rounded-2xl pointer-events-none"
                            style={{
                                background: `linear-gradient(135deg, ${color}20, ${accentColor}20)`,
                            }}
                            animate={{
                                opacity: [0, 0.4, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.5,
                            }}
                        />
                    </div>
                </motion.div>
            ))}
        </div>
    );
};

// ==================== ENHANCED MODULE SLIDES WITH FLIP ANIMATION ====================
const EnhancedAssetManagementSlide = () => {
    const icons = [Server, Laptop, HardDrive, Smartphone];
    const color = "#a78bfa";
    const accentColor = "#c4b5fd";

    return (
        <div className="flex h-full w-full relative overflow-hidden">
            <div className="relative w-7/12 flex flex-col justify-center p-12 rounded-l-3xl overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
                {/* Animated background with wave effect */}
                <div className="absolute inset-0">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-full h-32 bg-white/5"
                            style={{
                                top: `${i * 20}%`,
                            }}
                            animate={{
                                x: ['-100%', '100%'],
                                opacity: [0, 0.3, 0],
                            }}
                            transition={{
                                duration: 4 + i,
                                repeat: Infinity,
                                delay: i * 0.8,
                                ease: "linear"
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-white space-y-6"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <motion.div
                                className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                                animate={{
                                    rotateY: [0, 360],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            >
                                <Server className="text-white" size={32} />
                            </motion.div>
                            <div>
                                <h3 className="text-4xl font-bold drop-shadow-lg bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
                                    Asset Management
                                </h3>
                                <motion.div
                                    className="h-1 bg-gradient-to-r from-white to-transparent rounded-full mt-2"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </div>
                        </div>
                        <p className="text-lg text-white/90 drop-shadow font-light leading-relaxed">
                            Track and manage your IT assets in real-time with intelligent automation
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-8">
                        {[
                            { label: "Total Assets", value: "13,547", icon: Monitor, trend: "+12%" },
                            { label: "Active Devices", value: "12,893", icon: Laptop, trend: "+8%" },
                            { label: "In Maintenance", value: "654", icon: Settings, trend: "-3%" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    delay: 0.3 + i * 0.2,
                                    duration: 0.6,
                                    type: "spring",
                                    stiffness: 100
                                }}
                                className="group relative bg-white/15 backdrop-blur-xl rounded-3xl p-8 text-center space-y-4 border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300"
                                whileHover={{ scale: 1.05, y: -5 }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                <motion.div
                                    className="relative"
                                    whileHover={{ rotate: 10 }}
                                >
                                    <stat.icon className="text-white mx-auto drop-shadow-lg mb-2" size={48} />
                                </motion.div>
                                <div className="relative">
                                    <p className="text-3xl font-bold text-white drop-shadow-lg mb-1">{stat.value}</p>
                                    <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                                    <motion.div
                                        className="flex items-center justify-center gap-1 mt-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.1 }}
                                    >
                                        <TrendingUp size={14} className="text-green-300" />
                                        <span className="text-xs text-green-300 font-semibold">{stat.trend}</span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <ModernIconGrid icons={icons} color={color} accentColor={accentColor} />
        </div>
    );
};

const EnhancedIncidentManagementSlide = () => {
    const icons = [Siren, ShieldAlert, Bug, Wrench];
    const color = "#34d399";
    const accentColor = "#6ee7b7";

    return (
        <div className="flex h-full w-full relative overflow-hidden">
            <div className="relative w-7/12 flex flex-col justify-center p-12 rounded-l-3xl overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-700">
                <div className="absolute inset-0">
                    {[...Array(4)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-32 h-32 rounded-full bg-white/10"
                            style={{
                                left: `${20 + i * 25}%`,
                                top: `${10 + i * 20}%`,
                            }}
                            animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.1, 0.3, 0.1],
                            }}
                            transition={{
                                duration: 3 + i * 0.5,
                                repeat: Infinity,
                                delay: i * 0.8,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-white space-y-6"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <motion.div
                                className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                                animate={{
                                    rotate: [0, 10, -10, 0],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <Siren className="text-white" size={32} />
                            </motion.div>
                            <div>
                                <h3 className="text-4xl font-bold drop-shadow-lg bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
                                    Incident Management
                                </h3>
                                <motion.div
                                    className="h-1 bg-gradient-to-r from-white to-transparent rounded-full mt-2"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </div>
                        </div>
                        <p className="text-lg text-white/90 drop-shadow font-light leading-relaxed">
                            Resolve incidents faster with AI-powered intelligent routing
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-8">
                        {[
                            { label: "Resolved", value: "54,291", icon: FileCheck, trend: "+15%" },
                            { label: "Avg Response", value: "2.3 min", icon: Clock, trend: "-22%" },
                            { label: "Active Cases", value: "89", icon: AlertTriangle, trend: "-5%" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    delay: 0.3 + i * 0.2,
                                    duration: 0.6,
                                    type: "spring",
                                    stiffness: 100
                                }}
                                className="group relative bg-white/15 backdrop-blur-xl rounded-3xl p-8 text-center space-y-4 border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300"
                                whileHover={{ scale: 1.05, y: -5 }}
                            >
                                <motion.div
                                    className="relative"
                                    whileHover={{ rotate: 10 }}
                                >
                                    <stat.icon className="text-white mx-auto drop-shadow-lg mb-2" size={48} />
                                </motion.div>
                                <div className="relative">
                                    <p className="text-3xl font-bold text-white drop-shadow-lg mb-1">{stat.value}</p>
                                    <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                                    <motion.div
                                        className="flex items-center justify-center gap-1 mt-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.1 }}
                                    >
                                        <TrendingUp size={14} className="text-green-300" />
                                        <span className="text-xs text-green-300 font-semibold">{stat.trend}</span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <ModernIconGrid icons={icons} color={color} accentColor={accentColor} />
        </div>
    );
};

const EnhancedSIMManagementSlide = () => {
    const icons = [TowerControl, Signal, Wifi, Router];
    const color = "#60a5fa";
    const accentColor = "#93c5fd";

    return (
        <div className="flex h-full w-full relative overflow-hidden">
            <div className="relative w-7/12 flex flex-col justify-center p-12 rounded-l-3xl overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-700">
                <div className="absolute inset-0">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute"
                            style={{
                                left: `${10 + i * 15}%`,
                                top: `${20 + (i % 2) * 40}%`,
                                width: '4px',
                                height: '60px',
                                background: 'rgba(255,255,255,0.2)',
                                borderRadius: '2px',
                            }}
                            animate={{
                                scaleY: [0.3, 1, 0.3],
                                opacity: [0.3, 0.8, 0.3],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.2,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-white space-y-6"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <motion.div
                                className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                                animate={{
                                    scale: [1, 1.2, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    repeatType: "reverse"
                                }}
                            >
                                <Signal className="text-white" size={32} />
                            </motion.div>
                            <div>
                                <h3 className="text-4xl font-bold drop-shadow-lg bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                                    SIM Management
                                </h3>
                                <motion.div
                                    className="h-1 bg-gradient-to-r from-white to-transparent rounded-full mt-2"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </div>
                        </div>
                        <p className="text-lg text-white/90 drop-shadow font-light leading-relaxed">
                            Monitor and optimize mobile connectivity with advanced analytics
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-8">
                        {[
                            { label: "Active SIMs", value: "3,847", icon: Signal, trend: "+7%" },
                            { label: "Data Usage", value: "38.7 TB", icon: Activity, trend: "+23%" },
                            { label: "Coverage", value: "99.8%", icon: Wifi, trend: "+0.2%" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    delay: 0.3 + i * 0.2,
                                    duration: 0.6,
                                    type: "spring",
                                    stiffness: 100
                                }}
                                className="group relative bg-white/15 backdrop-blur-xl rounded-3xl p-8 text-center space-y-4 border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300"
                                whileHover={{ scale: 1.05, y: -5 }}
                            >
                                <motion.div
                                    className="relative"
                                    whileHover={{ rotate: 10 }}
                                >
                                    <stat.icon className="text-white mx-auto drop-shadow-lg mb-2" size={48} />
                                </motion.div>
                                <div className="relative">
                                    <p className="text-3xl font-bold text-white drop-shadow-lg mb-1">{stat.value}</p>
                                    <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                                    <motion.div
                                        className="flex items-center justify-center gap-1 mt-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.1 }}
                                    >
                                        <TrendingUp size={14} className="text-green-300" />
                                        <span className="text-xs text-green-300 font-semibold">{stat.trend}</span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <ModernIconGrid icons={icons} color={color} accentColor={accentColor} />
        </div>
    );
};

const EnhancedChangeManagementSlide = () => {
    const icons = [GitPullRequest, GitBranchPlus, Package, ClipboardCheck];
    const color = "#a3e635";
    const accentColor = "#bef264";

    return (
        <div className="flex h-full w-full relative overflow-hidden">
            <div className="relative w-7/12 flex flex-col justify-center p-12 rounded-l-3xl overflow-hidden bg-gradient-to-br from-lime-500 via-green-600 to-emerald-700">
                <div className="absolute inset-0">
                    {[...Array(5)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-2 bg-white/20 rounded-full"
                            style={{
                                left: `${15 + i * 20}%`,
                                top: '10%',
                                height: '80%',
                            }}
                            animate={{
                                scaleY: [0, 1, 0],
                                opacity: [0, 0.6, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.4,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-white space-y-6"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <motion.div
                                className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                                animate={{
                                    rotateY: [0, 180, 360],
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <GitPullRequest className="text-white" size={32} />
                            </motion.div>
                            <div>
                                <h3 className="text-4xl font-bold drop-shadow-lg bg-gradient-to-r from-white to-lime-100 bg-clip-text text-transparent">
                                    Change Management
                                </h3>
                                <motion.div
                                    className="h-1 bg-gradient-to-r from-white to-transparent rounded-full mt-2"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </div>
                        </div>
                        <p className="text-lg text-white/90 drop-shadow font-light leading-relaxed">
                            Deploy changes with confidence using automated workflows
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-8">
                        {[
                            { label: "Deployed", value: "4,285", icon: GitPullRequest, trend: "+18%" },
                            { label: "Success Rate", value: "98.5%", icon: FileCheck, trend: "+2%" },
                            { label: "Pending", value: "23", icon: Clock, trend: "-12%" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    delay: 0.3 + i * 0.2,
                                    duration: 0.6,
                                    type: "spring",
                                    stiffness: 100
                                }}
                                className="group relative bg-white/15 backdrop-blur-xl rounded-3xl p-8 text-center space-y-4 border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300"
                                whileHover={{ scale: 1.05, y: -5 }}
                            >
                                <motion.div
                                    className="relative"
                                    whileHover={{ rotate: 10 }}
                                >
                                    <stat.icon className="text-white mx-auto drop-shadow-lg mb-2" size={48} />
                                </motion.div>
                                <div className="relative">
                                    <p className="text-3xl font-bold text-white drop-shadow-lg mb-1">{stat.value}</p>
                                    <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                                    <motion.div
                                        className="flex items-center justify-center gap-1 mt-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.1 }}
                                    >
                                        <TrendingUp size={14} className="text-green-300" />
                                        <span className="text-xs text-green-300 font-semibold">{stat.trend}</span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <ModernIconGrid icons={icons} color={color} accentColor={accentColor} />
        </div>
    );
};

const EnhancedHelpdeskSlide = () => {
    const icons = [Headset, PhoneCall, LifeBuoy, MessageSquarePlus];
    const color = "#2dd4bf";
    const accentColor = "#5eead4";

    return (
        <div className="flex h-full w-full relative overflow-hidden">
            <div className="relative w-7/12 flex flex-col justify-center p-12 rounded-l-3xl overflow-hidden bg-gradient-to-br from-teal-500 via-cyan-600 to-blue-700">
                <div className="absolute inset-0">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-3 h-3 bg-white/20 rounded-full"
                            style={{
                                left: `${10 + (i % 4) * 25}%`,
                                top: `${20 + Math.floor(i / 4) * 40}%`,
                            }}
                            animate={{
                                scale: [0, 1.5, 0],
                                opacity: [0, 0.8, 0],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: i * 0.3,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-white space-y-6"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <motion.div
                                className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                                animate={{
                                    rotate: [0, -10, 10, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Headset className="text-white" size={32} />
                            </motion.div>
                            <div>
                                <h3 className="text-4xl font-bold drop-shadow-lg bg-gradient-to-r from-white to-teal-100 bg-clip-text text-transparent">
                                    Helpdesk Support
                                </h3>
                                <motion.div
                                    className="h-1 bg-gradient-to-r from-white to-transparent rounded-full mt-2"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </div>
                        </div>
                        <p className="text-lg text-white/90 drop-shadow font-light leading-relaxed">
                            24/7 intelligent support with AI-powered ticket resolution
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-8">
                        {[
                            { label: "Tickets Closed", value: "52,847", icon: Ticket, trend: "+24%" },
                            { label: "Avg Resolution", value: "4.8 hrs", icon: Clock, trend: "-15%" },
                            { label: "Satisfaction", value: "96.8%", icon: UserCheck, trend: "+3%" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    delay: 0.3 + i * 0.2,
                                    duration: 0.6,
                                    type: "spring",
                                    stiffness: 100
                                }}
                                className="group relative bg-white/15 backdrop-blur-xl rounded-3xl p-8 text-center space-y-4 border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300"
                                whileHover={{ scale: 1.05, y: -5 }}
                            >
                                <motion.div
                                    className="relative"
                                    whileHover={{ rotate: 10 }}
                                >
                                    <stat.icon className="text-white mx-auto drop-shadow-lg mb-2" size={48} />
                                </motion.div>
                                <div className="relative">
                                    <p className="text-3xl font-bold text-white drop-shadow-lg mb-1">{stat.value}</p>
                                    <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                                    <motion.div
                                        className="flex items-center justify-center gap-1 mt-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.1 }}
                                    >
                                        <TrendingUp size={14} className="text-green-300" />
                                        <span className="text-xs text-green-300 font-semibold">{stat.trend}</span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <ModernIconGrid icons={icons} color={color} accentColor={accentColor} />
        </div>
    );
};

const EnhancedDocumentManagementSlide = () => {
    const icons = [FileText, FolderArchive, Printer, ScanLine];
    const color = "#818cf8";
    const accentColor = "#a5b4fc";

    return (
        <div className="flex h-full w-full relative overflow-hidden">
            <div className="relative w-7/12 flex flex-col justify-center p-12 rounded-l-3xl overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-700">
                <div className="absolute inset-0">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute bg-white/10 rounded-lg"
                            style={{
                                left: `${15 + i * 12}%`,
                                top: `${20 + (i % 2) * 30}%`,
                                width: '60px',
                                height: '80px',
                            }}
                            animate={{
                                y: [0, -10, 0],
                                rotateY: [0, 180, 360],
                                opacity: [0.2, 0.5, 0.2],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: i * 0.5,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-white space-y-6"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <motion.div
                                className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                                animate={{
                                    scale: [1, 1.1, 1],
                                    rotateZ: [0, 5, -5, 0]
                                }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <FileText className="text-white" size={32} />
                            </motion.div>
                            <div>
                                <h3 className="text-4xl font-bold drop-shadow-lg bg-gradient-to-r from-white to-indigo-100 bg-clip-text text-transparent">
                                    Document Management
                                </h3>
                                <motion.div
                                    className="h-1 bg-gradient-to-r from-white to-transparent rounded-full mt-2"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </div>
                        </div>
                        <p className="text-lg text-white/90 drop-shadow font-light leading-relaxed">
                            Secure storage and smart document organization with AI search
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-8">
                        {[
                            { label: "Documents", value: "8,437", icon: FileText, trend: "+31%" },
                            { label: "Storage Used", value: "2.4 TB", icon: HardDrive, trend: "+19%" },
                            { label: "Shared Files", value: "1,293", icon: Users, trend: "+45%" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    delay: 0.3 + i * 0.2,
                                    duration: 0.6,
                                    type: "spring",
                                    stiffness: 100
                                }}
                                className="group relative bg-white/15 backdrop-blur-xl rounded-3xl p-8 text-center space-y-4 border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300"
                                whileHover={{ scale: 1.05, y: -5 }}
                            >
                                <motion.div
                                    className="relative"
                                    whileHover={{ rotate: 10 }}
                                >
                                    <stat.icon className="text-white mx-auto drop-shadow-lg mb-2" size={48} />
                                </motion.div>
                                <div className="relative">
                                    <p className="text-3xl font-bold text-white drop-shadow-lg mb-1">{stat.value}</p>
                                    <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                                    <motion.div
                                        className="flex items-center justify-center gap-1 mt-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.1 }}
                                    >
                                        <TrendingUp size={14} className="text-green-300" />
                                        <span className="text-xs text-green-300 font-semibold">{stat.trend}</span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <ModernIconGrid icons={icons} color={color} accentColor={accentColor} />
        </div>
    );
};

const EnhancedHRManagement = () => {
    const icons = [Users, Briefcase, UserCog, Calendar];
    const color = "#f472b6";
    const accentColor = "#f9a8d4";

    return (
        <div className="flex h-full w-full relative overflow-hidden">
            <div className="relative w-7/12 flex flex-col justify-center p-12 rounded-l-3xl overflow-hidden bg-gradient-to-br from-pink-500 via-rose-600 to-purple-700">
                <div className="absolute inset-0">
                    {[...Array(10)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-8 h-8 bg-white/10 rounded-full"
                            style={{
                                left: `${10 + (i % 5) * 20}%`,
                                top: `${15 + Math.floor(i / 5) * 35}%`,
                            }}
                            animate={{
                                scale: [0.5, 1.2, 0.5],
                                opacity: [0.2, 0.6, 0.2],
                                rotate: [0, 180, 360],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                delay: i * 0.4,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-white space-y-6"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <motion.div
                                className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                                animate={{
                                    scale: [1, 1.15, 1],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Users className="text-white" size={32} />
                            </motion.div>
                            <div>
                                <h3 className="text-4xl font-bold drop-shadow-lg bg-gradient-to-r from-white to-pink-100 bg-clip-text text-transparent">
                                    HR Management
                                </h3>
                                <motion.div
                                    className="h-1 bg-gradient-to-r from-white to-transparent rounded-full mt-2"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </div>
                        </div>
                        <p className="text-lg text-white/90 drop-shadow font-light leading-relaxed">
                            Streamline employee management with intelligent automation
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-8">
                        {[
                            { label: "Employees", value: "1,547", icon: Users, trend: "+8%" },
                            { label: "Attendance", value: "97.2%", icon: Calendar, trend: "+2%" },
                            { label: "Satisfaction", value: "4.5/5", icon: UserCheck, trend: "+0.3" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    delay: 0.3 + i * 0.2,
                                    duration: 0.6,
                                    type: "spring",
                                    stiffness: 100
                                }}
                                className="group relative bg-white/15 backdrop-blur-xl rounded-3xl p-8 text-center space-y-4 border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300"
                                whileHover={{ scale: 1.05, y: -5 }}
                            >
                                <motion.div
                                    className="relative"
                                    whileHover={{ rotate: 10 }}
                                >
                                    <stat.icon className="text-white mx-auto drop-shadow-lg mb-2" size={48} />
                                </motion.div>
                                <div className="relative">
                                    <p className="text-3xl font-bold text-white drop-shadow-lg mb-1">{stat.value}</p>
                                    <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                                    <motion.div
                                        className="flex items-center justify-center gap-1 mt-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.1 }}
                                    >
                                        <TrendingUp size={14} className="text-green-300" />
                                        <span className="text-xs text-green-300 font-semibold">{stat.trend}</span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <ModernIconGrid icons={icons} color={color} accentColor={accentColor} />
        </div>
    );
};

const EnhancedNOCMonitoringSlide = () => {
    const icons = [Monitor, Network, Database, Activity];
    const color = "#22d3ee";
    const accentColor = "#67e8f9";

    return (
        <div className="flex h-full w-full relative overflow-hidden">
            <div className="relative w-7/12 flex flex-col justify-center p-12 rounded-l-3xl overflow-hidden bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700">
                <div className="absolute inset-0">
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute w-1 bg-white/30 rounded-full"
                            style={{
                                left: `${8 + i * 8}%`,
                                top: '20%',
                                height: `${30 + Math.sin(i) * 20}%`,
                            }}
                            animate={{
                                scaleY: [0.3, 1, 0.3],
                                opacity: [0.3, 0.8, 0.3],
                            }}
                            transition={{
                                duration: 1.5,
                                repeat: Infinity,
                                delay: i * 0.1,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-white space-y-6"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <motion.div
                                className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                                animate={{
                                    boxShadow: [
                                        "0 0 20px rgba(255,255,255,0.3)",
                                        "0 0 40px rgba(255,255,255,0.5)",
                                        "0 0 20px rgba(255,255,255,0.3)"
                                    ]
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Monitor className="text-white" size={32} />
                            </motion.div>
                            <div>
                                <h3 className="text-4xl font-bold drop-shadow-lg bg-gradient-to-r from-white to-cyan-100 bg-clip-text text-transparent">
                                    NOC Monitoring
                                </h3>
                                <motion.div
                                    className="h-1 bg-gradient-to-r from-white to-transparent rounded-full mt-2"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </div>
                        </div>
                        <p className="text-lg text-white/90 drop-shadow font-light leading-relaxed">
                            24/7 network operations center with predictive analytics
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-8">
                        {[
                            { label: "Uptime", value: "99.98%", icon: Activity, trend: "+0.02%" },
                            { label: "Systems", value: "847", icon: Monitor, trend: "+12" },
                            { label: "Alerts/Day", value: "12", icon: AlertTriangle, trend: "-8" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    delay: 0.3 + i * 0.2,
                                    duration: 0.6,
                                    type: "spring",
                                    stiffness: 100
                                }}
                                className="group relative bg-white/15 backdrop-blur-xl rounded-3xl p-8 text-center space-y-4 border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300"
                                whileHover={{ scale: 1.05, y: -5 }}
                            >
                                <motion.div
                                    className="relative"
                                    whileHover={{ rotate: 10 }}
                                >
                                    <stat.icon className="text-white mx-auto drop-shadow-lg mb-2" size={48} />
                                </motion.div>
                                <div className="relative">
                                    <p className="text-3xl font-bold text-white drop-shadow-lg mb-1">{stat.value}</p>
                                    <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                                    <motion.div
                                        className="flex items-center justify-center gap-1 mt-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.1 }}
                                    >
                                        <TrendingUp size={14} className="text-green-300" />
                                        <span className="text-xs text-green-300 font-semibold">{stat.trend}</span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <ModernIconGrid icons={icons} color={color} accentColor={accentColor} />
        </div>
    );
};

const EnhancedPolicyManagementSlide = () => {
    const icons = [Shield, Gavel, Scale, BookOpen];
    const color = "#38bdf8";
    const accentColor = "#7dd3fc";

    return (
        <div className="flex h-full w-full relative overflow-hidden">
            <div className="relative w-7/12 flex flex-col justify-center p-12 rounded-l-3xl overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800">
                <div className="absolute inset-0">
                    {[...Array(6)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute border-2 border-white/20 rounded-lg"
                            style={{
                                left: `${10 + i * 15}%`,
                                top: `${25 + (i % 2) * 25}%`,
                                width: '80px',
                                height: '100px',
                            }}
                            animate={{
                                rotateY: [0, 180, 360],
                                opacity: [0.2, 0.5, 0.2],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                delay: i * 0.7,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-white space-y-6"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <motion.div
                                className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                                animate={{
                                    rotate: [0, 10, -10, 0],
                                    scale: [1, 1.05, 1]
                                }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <Shield className="text-white" size={32} />
                            </motion.div>
                            <div>
                                <h3 className="text-4xl font-bold drop-shadow-lg bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                                    Policy Management
                                </h3>
                                <motion.div
                                    className="h-1 bg-gradient-to-r from-white to-transparent rounded-full mt-2"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </div>
                        </div>
                        <p className="text-lg text-white/90 drop-shadow font-light leading-relaxed">
                            Enforce compliance and security policies with automated monitoring
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-8">
                        {[
                            { label: "Policies", value: "128", icon: Shield, trend: "+15" },
                            { label: "Compliance", value: "96.8%", icon: FileCheck, trend: "+1.2%" },
                            { label: "Audits", value: "247", icon: BookOpen, trend: "+23" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    delay: 0.3 + i * 0.2,
                                    duration: 0.6,
                                    type: "spring",
                                    stiffness: 100
                                }}
                                className="group relative bg-white/15 backdrop-blur-xl rounded-3xl p-8 text-center space-y-4 border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300"
                                whileHover={{ scale: 1.05, y: -5 }}
                            >
                                <motion.div
                                    className="relative"
                                    whileHover={{ rotate: 10 }}
                                >
                                    <stat.icon className="text-white mx-auto drop-shadow-lg mb-2" size={48} />
                                </motion.div>
                                <div className="relative">
                                    <p className="text-3xl font-bold text-white drop-shadow-lg mb-1">{stat.value}</p>
                                    <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                                    <motion.div
                                        className="flex items-center justify-center gap-1 mt-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.1 }}
                                    >
                                        <TrendingUp size={14} className="text-green-300" />
                                        <span className="text-xs text-green-300 font-semibold">{stat.trend}</span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <ModernIconGrid icons={icons} color={color} accentColor={accentColor} />
        </div>
    );
};

const EnhancedHubPaymentsSlide = () => {
    const icons = [CreditCard, Banknote, Receipt, Landmark];
    const color = "#fb923c";
    const accentColor = "#fdba74";

    return (
        <div className="flex h-full w-full relative overflow-hidden">
            <div className="relative w-7/12 flex flex-col justify-center p-12 rounded-l-3xl overflow-hidden bg-gradient-to-br from-orange-500 via-red-600 to-pink-700">
                <div className="absolute inset-0">
                    {[...Array(8)].map((_, i) => (
                        <motion.div
                            key={i}
                            className="absolute bg-white/10 rounded-full"
                            style={{
                                left: `${15 + (i % 4) * 20}%`,
                                top: `${20 + Math.floor(i / 4) * 30}%`,
                                width: '40px',
                                height: '40px',
                            }}
                            animate={{
                                scale: [0.8, 1.3, 0.8],
                                opacity: [0.3, 0.7, 0.3],
                                rotate: [0, 360],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                delay: i * 0.4,
                            }}
                        />
                    ))}
                </div>

                <div className="relative z-10 space-y-10">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-white space-y-6"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <motion.div
                                className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                                animate={{
                                    rotateY: [0, 180, 360],
                                    scale: [1, 1.1, 1]
                                }}
                                transition={{
                                    duration: 2.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <CreditCard className="text-white" size={32} />
                            </motion.div>
                            <div>
                                <h3 className="text-4xl font-bold drop-shadow-lg bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent">
                                    Hub Payments
                                </h3>
                                <motion.div
                                    className="h-1 bg-gradient-to-r from-white to-transparent rounded-full mt-2"
                                    initial={{ width: 0 }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                />
                            </div>
                        </div>
                        <p className="text-lg text-white/90 drop-shadow font-light leading-relaxed">
                            Process payments securely with blockchain-powered transactions
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-3 gap-8">
                        {[
                            { label: "Transactions", value: "$1.2M", icon: CreditCard, trend: "+28%" },
                            { label: "Success Rate", value: "99.8%", icon: FileCheck, trend: "+0.1%" },
                            { label: "Avg Speed", value: "1.2s", icon: Clock, trend: "-0.3s" }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{
                                    delay: 0.3 + i * 0.2,
                                    duration: 0.6,
                                    type: "spring",
                                    stiffness: 100
                                }}
                                className="group relative bg-white/15 backdrop-blur-xl rounded-3xl p-8 text-center space-y-4 border border-white/20 shadow-2xl hover:bg-white/20 transition-all duration-300"
                                whileHover={{ scale: 1.05, y: -5 }}
                            >
                                <motion.div
                                    className="relative"
                                    whileHover={{ rotate: 10 }}
                                >
                                    <stat.icon className="text-white mx-auto drop-shadow-lg mb-2" size={48} />
                                </motion.div>
                                <div className="relative">
                                    <p className="text-3xl font-bold text-white drop-shadow-lg mb-1">{stat.value}</p>
                                    <p className="text-sm text-white/80 font-medium">{stat.label}</p>
                                    <motion.div
                                        className="flex items-center justify-center gap-1 mt-2"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 1 + i * 0.1 }}
                                    >
                                        <TrendingUp size={14} className="text-green-300" />
                                        <span className="text-xs text-green-300 font-semibold">{stat.trend}</span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
            <ModernIconGrid icons={icons} color={color} accentColor={accentColor} />
        </div>
    );
};

// Updated modules array with enhanced slides
const modules = [
  { name: "Asset Management", icon: Monitor, color: "#a78bfa", slide: EnhancedAssetManagementSlide },
  { name: "Incident Management", icon: AlertTriangle, color: "#34d399", slide: EnhancedIncidentManagementSlide },
  { name: "SIM Management", icon: Signal, color: "#60a5fa", slide: EnhancedSIMManagementSlide },
  { name: "Change Management", icon: GitPullRequest, color: "#a3e635", slide: EnhancedChangeManagementSlide },
  { name: "Helpdesk", icon: Headset, color: "#2dd4bf", slide: EnhancedHelpdeskSlide },
  { name: "Document Management", icon: FileText, color: "#818cf8", slide: EnhancedDocumentManagementSlide },
  { name: "HR Management", icon: Users, color: "#f472b6", slide: EnhancedHRManagement },
  { name: "NOC Monitoring", icon: Monitor, color: "#22d3ee", slide: EnhancedNOCMonitoringSlide },
  { name: "Policy Management", icon: Shield, color: "#38bdf8", slide: EnhancedPolicyManagementSlide },
  { name: "Hub/Payments", icon: CreditCard, color: "#fb923c", slide: EnhancedHubPaymentsSlide }
];

// ==================== SLIDE ANIMATION VARIANTS (ZOOM & FADE) ====================
const slideVariants: Variants = {
    initial: {
      scale: 0.8,
      opacity: 0,
    },
    animate: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: {
      scale: 1.1,
      opacity: 0,
      transition: {
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1]
      }
    }
};


// ==================== AUTH COMPONENTS ====================
function ForgotPasswordModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HelpCircle className="text-purple-400" size={24} />
            <h3 className="text-xl font-bold text-white">Forgot Password</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        <div className="space-y-4 text-gray-300">
          <p>To change your password, please follow these steps:</p>
          <div className="bg-slate-700/50 rounded-lg p-4 space-y-3 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
              <span>Press <kbd className="px-2 py-1 bg-slate-600 border border-slate-500 rounded text-sm font-mono">CTRL + ALT + DEL</kbd></span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
              <span>Select <strong>"Change a password"</strong> from the menu</span>
            </div>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
            <p className="text-purple-300 text-sm">
              <strong>Alternative:</strong> If you're unable to change your password,
              please contact your IT support team for assistance.
            </p>
          </div>
        </div>
        <button onClick={onClose} className="w-full mt-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg shadow-purple-500/30">
          Understood
        </button>
      </motion.div>
    </motion.div>
  );
}

function AnimatedLogo() {
  return (
    <motion.div
        className="relative w-20 h-20 mb-4 mx-auto bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center"
        whileHover={{ scale: 1.05, rotate: 5 }}
        transition={{ type: "spring", stiffness: 300 }}
    >
        <motion.img
          src="/images/eazypay_logo.png"
          alt="EazyPay Logo"
          className="w-16 h-16 object-contain"
          onError={(e) => { e.currentTarget.src = "https://i.imgur.com/Jipm6aQ.png"; }}
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/30 to-pink-500/30 pointer-events-none"
            animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5]
            }}
            transition={{ duration: 2, repeat: Infinity }}
        />
    </motion.div>
  );
}

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [authMethod, setAuthMethod] = useState<'AD' | 'Local'>('AD');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
        if (authMethod === 'AD') {
            await authService.loginWithAD({ username, password });
        } else {
            await authService.loginLocal(username, password);
        }
        navigate('/dashboard');
    } catch (err: any) {
        console.error('Login error:', err);
        setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      <motion.div
        className="w-full max-w-sm relative z-50 mx-auto bg-slate-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="text-center">
          <AnimatedLogo />
          <motion.h1
            className="text-2xl font-bold text-white mb-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            EazyPay ITSM
          </motion.h1>
          <motion.p
            className="text-gray-400 text-sm mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            Sign in to continue
          </motion.p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
              className="w-full pl-10 pr-3 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-500 focus:bg-slate-700/70 hover:bg-slate-700/60 disabled:opacity-50"
            />
          </motion.div>
          <motion.div
            className="relative"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10 pointer-events-none" size={18} />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full pl-10 pr-10 py-3 bg-slate-700/50 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 outline-none transition-all duration-300 focus:border-purple-500 focus:bg-slate-700/70 hover:bg-slate-700/60 disabled:opacity-50"
            />
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors z-10 disabled:opacity-50"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              disabled={isLoading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </motion.button>
          </motion.div>
          <motion.div
            className="flex items-center justify-between text-xs"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center space-x-3 font-medium text-gray-400">
              <span
                onClick={() => !isLoading && setAuthMethod('AD')}
                className={`cursor-pointer transition ${authMethod === 'AD' ? 'text-white font-bold' : 'hover:text-white'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                AD
              </span>
              <div
                onClick={() => !isLoading && setAuthMethod(authMethod === 'AD' ? 'Local' : 'AD')}
                className={`w-10 h-5 rounded-full flex items-center p-0.5 cursor-pointer transition ${authMethod === 'AD' ? 'bg-purple-500' : 'bg-gray-600'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <motion.div layout transition={{ type: "spring", stiffness: 700, damping: 30 }} className={`w-4 h-4 bg-white rounded-full ${authMethod === 'Local' ? 'ml-5' : ''}`} />
              </div>
              <span
                onClick={() => !isLoading && setAuthMethod('Local')}
                className={`cursor-pointer transition ${authMethod === 'Local' ? 'text-white font-bold' : 'hover:text-white'} ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                Local
              </span>
            </div>
            <motion.button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-purple-400 hover:text-purple-300 font-medium transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.05 }}
              disabled={isLoading}
            >
              Forgot?
            </motion.button>
          </motion.div>
          {error && (
            <motion.p
              className="text-red-400 text-xs text-center"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}
          <motion.button
            type="submit"
            whileHover={!isLoading ? { scale: 1.02, boxShadow: "0 10px 25px rgba(168, 85, 247, 0.4)" } : {}}
            whileTap={!isLoading ? { scale: 0.98 } : {}}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg shadow-purple-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <motion.div
                className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            ) : (
              'Sign In'
            )}
          </motion.button>
        </form>
        <motion.p
          className="text-center text-xs text-gray-500 mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          © {new Date().getFullYear()} EazyPay. All Rights Reserved.
        </motion.p>
      </motion.div>
      <ForgotPasswordModal isOpen={showForgotPassword} onClose={() => setShowForgotPassword(false)} />
    </>
  );
}

// ==================== MAIN LOGIN PAGE COMPONENT ====================
export default function Login() {
  const [index, setIndex] = useState(0);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const moduleInterval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % modules.length);
    }, 5000);

    const timeInterval = setInterval(() => {
        setTime(new Date());
    }, 1000);

    return () => {
        clearInterval(moduleInterval);
        clearInterval(timeInterval);
    };
  }, []);

  const currentModule = modules[index];

  return (
    <div className="w-full h-screen relative overflow-hidden font-sans flex items-center justify-center">
      <VSCodeBackground />
      <FloatingShapes />
      <TimeDisplay time={time} />

      <div className="relative z-40 w-full h-full flex flex-col lg:flex-row items-center justify-center gap-4 p-6">

        <div className="w-full lg:w-[70%] h-full flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full max-w-4xl h-[600px] flex items-center shadow-2xl rounded-3xl overflow-hidden"
            >
              {currentModule.slide()}
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="w-full lg:w-[25%] flex items-center justify-center"
        >
          <LoginForm />
        </motion.div>
      </div>
    </div>
  );
}
