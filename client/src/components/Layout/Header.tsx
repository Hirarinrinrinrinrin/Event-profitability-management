import React from 'react';
import { Menu } from 'lucide-react';

interface HeaderProps {
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
    const now = new Date();
    const dateStr = now.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short',
    });

    return (
        <header style={{
            height: '54px',
            backgroundColor: 'white',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 28px',
            justifyContent: 'space-between',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            flexShrink: 0,
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button className="menu-button" onClick={onMenuClick}>
                    <Menu size={20} />
                </button>
                <span style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    color: 'var(--color-text-sub)',
                    letterSpacing: '0.03em',
                }}>
                    管理画面
                </span>
            </div>
            <div style={{
                fontSize: '13px',
                color: 'var(--color-text-sub)',
                fontWeight: 500,
                letterSpacing: '0.01em',
            }}>
                {dateStr}
            </div>
        </header>
    );
};
