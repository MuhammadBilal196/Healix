import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import {
  LayoutDashboard,
  Users,
  CheckSquare,
  Layers,
  Settings,
  FileClock,
  LogOut,
  Calendar,
  ClipboardList,
  Ambulance,
  BarChart3,
  ShieldCheck,
  SlidersHorizontal,
  Moon,
  Sun
} from 'lucide-react';

interface SidebarProps {
  role: 'ADMIN' | 'DOCTOR';
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

interface NavSection {
  title: string;
  items: { id: string; label: string; icon: React.ComponentType<{ className?: string }> }[];
}

export default function Sidebar({ role, activeTab, setActiveTab }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('healix_web_theme');
    return saved === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('healix_web_theme', theme);
  }, [theme]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminSections: NavSection[] = [
    {
      title: 'Command & Triage',
      items: [
        { id: 'dashboard', label: 'Command Center', icon: LayoutDashboard },
        { id: 'emergency', label: 'Emergency & Fleet', icon: Ambulance },
        { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
      ],
    },
    {
      title: 'Credential Governance',
      items: [
        { id: 'nurses', label: 'Nurse Verification', icon: CheckSquare },
        { id: 'doctors', label: 'Doctor Verification', icon: ShieldCheck },
        { id: 'marketplace', label: 'Marketplace Monitor', icon: Layers },
      ],
    },
    {
      title: 'Directory & Operations',
      items: [
        { id: 'users', label: 'User Directory', icon: Users },
        { id: 'operations', label: 'Permissions & Support', icon: SlidersHorizontal },
      ],
    },
    {
      title: 'System & Compliance',
      items: [
        { id: 'config', label: 'Platform Config', icon: Settings },
        { id: 'audit', label: 'Audit Logs', icon: FileClock },
        { id: 'security', label: 'Account Security', icon: ShieldCheck },
      ],
    },
  ];

  const doctorSections: NavSection[] = [
    {
      title: 'Clinical Triage',
      items: [
        { id: 'dashboard', label: 'Case Queue', icon: ClipboardList },
        { id: 'emergency', label: 'Dispatches & Admissions', icon: Ambulance },
        { id: 'homevisits', label: 'Home Visits', icon: Calendar },
      ],
    },
    {
      title: 'Insights & Security',
      items: [
        { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
        { id: 'security', label: 'Account Security', icon: ShieldCheck },
      ],
    },
  ];

  const sections = role === 'ADMIN' ? adminSections : doctorSections;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">H</div>
        <div>
          <div className="sidebar-logo-text">Healix</div>
          <div className="sidebar-logo-sub">{role === 'ADMIN' ? 'Governance' : 'Doctor Portal'}</div>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Primary Navigation">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="sidebar-section">{section.title}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <Icon className="nav-icon" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="theme-toggle-btn"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
            {theme === 'light' ? 'Dark Mode' : 'Clinical Light'}
          </span>
          <span style={{ fontSize: '10px', opacity: 0.75 }}>{theme.toUpperCase()}</span>
        </button>

        <div className="user-card">
          <div className="user-avatar">
            {user?.fullName?.slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.fullName || 'User'}
            </div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>

        <button
          type="button"
          className="nav-item"
          onClick={handleLogout}
          style={{ color: '#FCA5A5' }}
        >
          <LogOut className="nav-icon" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
