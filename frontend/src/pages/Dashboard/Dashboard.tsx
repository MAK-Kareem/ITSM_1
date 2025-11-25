import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
// This is the corrected import path
import { ThemeContext } from '../../components/Layout/MainLayout';

// --- ICONS ---
const AssetIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 8h14M2 11h20M5 14h14M2 17h20M9 5h6a2 2 0 012 2v10a2 2 0 01-2 2H9a2 2 0 01-2-2V7a2 2 0 012-2z"/></svg>;
const IncidentIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>;
const ChangeIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.51 9M3.51 15a9 9 0 0014.98 0"/></svg>;
const HelpdeskIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 10a6 6 0 00-12 0v1h12v-1zM21 12H3v4a4 4 0 004 4h10a4 4 0 004-4v-4zM8 22v-2m8 2v-2"/></svg>;
const DocumentIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>;
const HRIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="9" cy="7" r="4"/><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/></svg>;
const SimIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 8.66V15.5a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 012 15.5V8.66a1 1 0 011.6-.8l8-4a1 1 0 01.8 0l8 4a1 1 0 01.6.8zM2 12h20"/></svg>;
const NocIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M12 9v6M8 9v6M16 9v6"/></svg>;
const PolicyIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
const HubIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;


// --- Styles Component ---
const DashboardStyles = () => {
  const { theme } = useContext(ThemeContext);

  return (
    <style>{`
      .pro-dashboard {
        /* Use the light theme variable for background */
        background-color: ${theme === 'light' ? '#F4F7FA' : '#16181D'};
        min-height: 100vh;
        color: ${theme === 'light' ? '#333' : '#f4f4f5'};
        padding: 2rem;
        transition: background-color 0.3s ease;
      }
      .pro-dash-title h1 {
        font-size: 1.75rem;
        font-weight: 700;
        color: ${theme === 'light' ? '#111' : '#fff'};
        margin-bottom: 2rem;
      }

      /* --- Stats Grid (2x5) --- */
      .pro-stats-grid {
        position: relative;
        z-index: 2;
        display: grid;
        gap: 1.25rem;
        grid-template-columns: repeat(5, 1fr);
      }

      /* --- Professional Stat Card --- */
      .pro-stat-card {
        text-decoration: none;
        color: #f4f4f5;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        border-radius: 12px;
        padding: 1.5rem;
      }

      /* --- DARK MODE STYLES (Default) --- */
      .pro-stat-card {
        background-color: #1E222D;
        border: 1px solid #1E222D; /* Default border same as bg */
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        color: #a0a0a0;
      }
      .pro-stat-card .stat-title {
        color: #ffffff; /* Brighter title in dark mode */
      }
      .pro-stat-card .stat-context {
        color: #a0a0a0; /* Muted context */
      }
      .pro-stat-card .stat-icon svg {
        stroke: var(--stat-color);
        stroke-width: 1.5;
        fill: none;
      }
      .pro-stat-card:hover {
        transform: translateY(-4px);
        border-color: var(--stat-color);
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0px 30px 0px var(--stat-glow);
      }

      /* --- LIGHT MODE STYLES --- */
      /* These apply when theme is light */
      .theme-light .pro-stat-card {
        background-color: var(--stat-color); /* Filled color */
        border: 1px solid var(--stat-color);
        color: #ffffff; /* White text on colored bg */
        box-shadow: 0 6px 20px -5px var(--stat-glow);
      }
      .theme-light .pro-stat-card .stat-title,
      .theme-light .pro-stat-card .stat-context {
        color: rgba(255, 255, 255, 0.9);
      }
      .theme-light .pro-stat-card .stat-title {
        font-weight: 700;
      }
      .theme-light .pro-stat-card .stat-icon svg {
        stroke: #ffffff; /* White icon */
        stroke-width: 2;
        fill: none;
      }
      .theme-light .pro-stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 10px 30px -5px var(--stat-glow);
        filter: brightness(1.1);
      }

      /* --- Card Content (shared) --- */
      .stat-card-header {
        display: flex;
        justify-content: flex-start;
      }
      .stat-icon svg {
        width: 28px;
        height: 28px;
        transition: all 0.3s ease;
      }
      .stat-card-body {
        margin-top: 1rem;
      }
      .stat-title {
        font-size: 1.125rem;
        font-weight: 600;
        margin: 0;
      }
      .stat-context {
        font-size: 0.875rem;
        margin: 0.25rem 0 0 0;
      }

      /* --- Responsive Design --- */
      @media (max-width: 1200px) {
        .pro-stats-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }
      @media (max-width: 768px) {
        .pro-dashboard { padding: 1rem; }
        .pro-stats-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (max-width: 480px) {
        .pro-stats-grid {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
};

const Dashboard: React.FC = () => {
  const { theme } = useContext(ThemeContext);

  // FIX: Re-ordered this array to match the MainLayout.tsx sidebar
  const statsData = [
    // Row 1
    { name: 'Assets', path: '/assets', icon: <AssetIcon />, context: 'Manage all company assets', color: '#3b82f6', glow: 'rgba(59, 130, 246, 0.3)' },
    { name: 'Incidents', path: '/incidents', icon: <IncidentIcon />, context: 'Track and resolve issues', color: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' },
    { name: 'Helpdesk', path: '/helpdesk', icon: <HelpdeskIcon />, context: 'Support and user tickets', color: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' },
    { name: 'Change', path: '/change-requests', icon: <ChangeIcon />, context: 'Oversee system changes', color: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' },
    { name: 'Documents', path: '/documents', icon: <DocumentIcon />, context: 'Central file repository', color: '#06b6d4', glow: 'rgba(6, 182, 212, 0.3)' },

    // Row 2
    { name: 'Hub', path: '/hub', icon: <HubIcon />, context: 'View connected services', color: '#f97316', glow: 'rgba(249, 115, 22, 0.3)' },
    { name: 'NOC', path: '/noc', icon: <NocIcon />, context: 'Network operations center', color: '#14b8a6', glow: 'rgba(20, 184, 166, 0.3)' },
    { name: 'HR', path: '/hr', icon: <HRIcon />, context: 'Employee management', color: '#ec4899', glow: 'rgba(236, 72, 153, 0.3)' },
    { name: 'SIM', path: '/sim', icon: <SimIcon />, context: 'Manage mobile inventory', color: '#8b5cf6', glow: 'rgba(139, 92, 246, 0.3)' },
    { name: 'Policies', path: '/policies', icon: <PolicyIcon />, context: 'View company policies', color: '#6366f1', glow: 'rgba(99, 102, 241, 0.3)' },
  ];

  return (
    <div className={`pro-dashboard ${theme === 'light' ? 'theme-light' : ''}`}>
      <DashboardStyles />
      <div className="pro-dash-title">
        <h1>Dashboard</h1>
      </div>
      <main className="pro-stats-grid">
        {statsData.map((stat) => (
          <Link
            to={stat.path}
            key={stat.name}
            className="pro-stat-card"
            style={{
              '--stat-color': stat.color,
              '--stat-glow': stat.glow
            } as React.CSSProperties}
          >
            <div className="stat-card-header">
              <div className="stat-icon">{stat.icon}</div>
            </div>
            <div className="stat-card-body">
              <h3 className="stat-title">{stat.name}</h3>
              <p className="stat-context">{stat.context}</p>
            </div>
          </Link>
        ))}
      </main>
    </div>
  );
};

export default Dashboard;
