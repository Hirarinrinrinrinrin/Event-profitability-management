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
                <div style={{
                    padding: '24px',
                    fontSize: '22px',
                    fontWeight: 'bold',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    justifyContent: 'space-between'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Truck size={28} />
                        <div>出店ノート</div>
                    </div>
                </div>
                <nav style={{ flex: 1, padding: '16px' }}>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {navItems.map((item) => (
                            <li key={item.to}>
                                <NavLink
                                    to={item.to}
                                    onClick={onClose} // Close sidebar on navigation on mobile
                                    style={({ isActive }) => ({
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '14px 16px',
                                        borderRadius: '8px',
                                        textDecoration: 'none',
                                        color: isActive ? 'var(--color-primary)' : 'rgba(255,255,255,0.9)',
                                        backgroundColor: isActive ? 'white' : 'transparent',
                                        transition: 'all 0.2s',
                                        fontSize: '18px', // Large font for visibility
                                        fontWeight: isActive ? 600 : 500
                                    })}
                                >
                                    <item.icon size={24} style={{ marginRight: '12px' }} />
                                    {item.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div style={{ padding: '24px', fontSize: '14px', opacity: 0.7, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                    <p>ログイン中: オーナー様</p>
                </div>
            </aside>
        </>
    );
};
