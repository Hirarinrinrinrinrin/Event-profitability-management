import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    return (
        <header style={{
            height: '64px',
            backgroundColor: 'white',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 32px',
            justifyContent: 'space-between',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button className="menu-button" onClick={onMenuClick}>
                    <Menu />
                </button>
                <h2 style={{ fontSize: '20px', margin: 0, color: 'var(--color-text-sub)' }}>
                    {/* Dynamic Title could go here based on Route */}
                    管理画面
                </h2>
            </div>
            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', color: 'var(--color-text-sub)' }}>現在日時</div>
                    <div style={{ fontWeight: 'bold' }}>2026年1月23日 (金)</div>
                </div>
            </div>
        </header>
    );
};
