import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Calculator, Settings, Truck } from 'lucide-react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'ダッシュボード' },
        { to: '/register', icon: PlusCircle, label: '出店登録' },
        { to: '/input', icon: Calculator, label: '売上・経費入力' },
        { to: '/products', icon: Truck, label: '商品マスタ' },
        { to: '/settings', icon: Settings, label: '設定' },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={`mobile-overlay ${isOpen ? 'open' : ''}`}
                onClick={onClose}
            />

            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                {/* Logo */}
                <div style={{
                    padding: '20px 20px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '9px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}>
                    <Truck size={20} style={{ opacity: 0.85 }} />
                    <span style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '0.02em' }}>
                        出店ノート
                    </span>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px 10px' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                        {navItems.map((item) => (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    end={item.to === '/'}
                                    onClick={onClose}
                                    style={({ isActive }) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '9px 12px',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        color: isActive ? '#ffffff' : 'rgba(255,255,255,0.65)',
                                        backgroundColor: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                                        transition: 'all 0.15s',
                                        fontSize: '14px',
                                        fontWeight: isActive ? 600 : 400,
                                        letterSpacing: '0.01em',
                                    })}
                                    onMouseEnter={(e) => {
                                        const el = e.currentTarget;
                                        if (!el.style.backgroundColor || el.style.backgroundColor === 'transparent') {
                                            el.style.backgroundColor = 'rgba(255,255,255,0.07)';
                                            el.style.color = 'rgba(255,255,255,0.9)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        const el = e.currentTarget;
                                        if (el.getAttribute('aria-current') !== 'page') {
                                            el.style.backgroundColor = 'transparent';
                                            el.style.color = 'rgba(255,255,255,0.65)';
                                        }
                                    }}
                                >
                                    <item.icon size={17} style={{ marginRight: '10px', flexShrink: 0 }} />
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>

                {/* Footer */}
                <div style={{
                    padding: '14px 20px',
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.4)',
                    borderTop: '1px solid rgba(255,255,255,0.08)',
                    letterSpacing: '0.02em',
                }}>
                    オーナー様
                </div>
            </aside>
        </>
    );
};
