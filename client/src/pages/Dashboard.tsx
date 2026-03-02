import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Lock, AlertCircle } from 'lucide-react';
import * as db from '../db';

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<db.OpeningStats[]>([]);
    const [years, setYears] = useState<db.YearStatus[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        fetchYears();
    }, []);

    useEffect(() => {
        fetchStats();
    }, [selectedYear]);

    const fetchYears = async () => {
        try {
            const data = await db.getYears();
            setYears(data);
            if (data.length > 0 && !data.find((y) => y.year === selectedYear)) {
                setSelectedYear(data[0].year);
            }
        } catch (e) { console.error(e); }
    };

    const fetchStats = async () => {
        try {
            const allStats = await db.getOpeningsStats();
            const filtered = allStats.filter(s => new Date(s.date).getFullYear() === selectedYear);
            setStats(filtered);
        } catch (e) {
            console.error(e);
        }
    };

    const totalSales = stats.reduce((sum, s) => sum + s.sales, 0);
    const totalExpenses = stats.reduce((sum, s) => sum + s.expenses, 0);
    const totalCogs = stats.reduce((sum, s) => sum + s.cogs, 0);
    const totalProfit = totalSales - totalCogs - totalExpenses;

    const currentYearStatus = years.find(y => y.year === selectedYear)?.status;
    const isYearClosed = currentYearStatus === 'closed';

    const handleYearClose = async () => {
        if (!window.confirm(`${selectedYear}年度を締めますか？\n締めた年度は後から編集できなくなります（実装上はまだ制限なし）。`)) return;
        try {
            await db.closeYear(selectedYear);
            fetchYears();
            alert(`${selectedYear}年度を締めました。`);
        } catch (e) {
            console.error(e);
            alert('エラーが発生しました');
        }
    };

    const kpiCards = [
        {
            label: '総売上',
            value: totalSales,
            icon: <TrendingUp size={16} />,
            color: 'var(--color-primary)',
            valueColor: 'var(--color-text-main)',
        },
        {
            label: '総原価',
            value: totalCogs,
            icon: <TrendingDown size={16} />,
            color: '#d97706',
            valueColor: 'var(--color-text-main)',
        },
        {
            label: '総経費',
            value: totalExpenses,
            icon: <TrendingDown size={16} />,
            color: 'var(--color-secondary)',
            valueColor: 'var(--color-text-main)',
        },
        {
            label: '貢献利益',
            value: totalProfit,
            icon: <DollarSign size={16} />,
            color: totalProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)',
            valueColor: totalProfit >= 0 ? 'var(--color-success)' : 'var(--color-error)',
        },
    ];

    return (
        <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Header Row */}
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em' }}>ダッシュボード</h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            borderRadius: '8px',
                            border: '1px solid var(--color-border)',
                            color: 'var(--color-text-main)',
                            background: 'white',
                            cursor: 'pointer',
                        }}
                    >
                        {years.map(y => (
                            <option key={y.year} value={y.year}>{y.year}年度 {y.status === 'closed' ? '(済)' : ''}</option>
                        ))}
                        {years.length === 0 && <option value={new Date().getFullYear()}>{new Date().getFullYear()}年度</option>}
                    </select>

                    {isYearClosed ? (
                        <div className="closed-badge" style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '6px 12px', backgroundColor: '#f1f5f9',
                            borderRadius: '8px', color: '#94a3b8',
                            fontSize: '13px', fontWeight: 600,
                        }}>
                            <Lock size={14} /> 締め済み
                        </div>
                    ) : (
                        <button
                            onClick={handleYearClose}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '6px 14px', backgroundColor: '#0f172a',
                                color: 'white', borderRadius: '8px', cursor: 'pointer',
                                fontSize: '13px',
                            }}
                        >
                            <AlertCircle size={14} /> 年度締めを実行
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {kpiCards.map((card) => (
                    <div key={card.label} className="card" style={{
                        borderLeft: `4px solid ${card.color}`,
                        padding: '18px 20px',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                            <span style={{ color: card.color, display: 'flex' }}>{card.icon}</span>
                            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--color-text-sub)', letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                                {card.label}
                            </span>
                        </div>
                        <div style={{ fontSize: '26px', fontWeight: 700, color: card.valueColor, letterSpacing: '-0.02em' }}>
                            ¥{card.value.toLocaleString()}
                        </div>
                    </div>
                ))}
            </div>

            {/* Summary Table */}
            <div className="card" style={{ padding: '20px 24px' }}>
                <h2 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--color-text-main)' }}>
                    出店別サマリー
                </h2>
                {stats.length === 0 ? (
                    <p style={{ fontSize: '13px', color: 'var(--color-text-sub)', padding: '12px 0' }}>
                        データがありません。
                    </p>
                ) : (
                    <div className="table-container">
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                    {['日付', '場所', '状態', '売上', '原価', '経費', '利益'].map(col => (
                                        <th key={col} style={{
                                            padding: '8px 12px',
                                            textAlign: 'left',
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: 'var(--color-text-sub)',
                                            letterSpacing: '0.03em',
                                            textTransform: 'uppercase',
                                        }}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((s) => {
                                    const profit = s.sales - s.cogs - s.expenses;
                                    const isClosed = s.status === 'closed';
                                    return (
                                        <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '10px 12px', fontSize: '13px' }}>{s.date}</td>
                                            <td style={{ padding: '10px 12px', fontSize: '13px' }}>{s.location}</td>
                                            <td style={{ padding: '10px 12px' }}>
                                                <span style={{
                                                    padding: '3px 8px',
                                                    borderRadius: '99px',
                                                    fontSize: '11px',
                                                    backgroundColor: isClosed ? '#e2e8f0' : '#d1fae5',
                                                    color: isClosed ? '#64748b' : '#065f46',
                                                    fontWeight: 600,
                                                }}>
                                                    {isClosed ? '済' : '営業中'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '10px 12px', fontSize: '13px' }}>¥{s.sales.toLocaleString()}</td>
                                            <td style={{ padding: '10px 12px', fontSize: '13px' }}>¥{s.cogs.toLocaleString()}</td>
                                            <td style={{ padding: '10px 12px', fontSize: '13px' }}>¥{s.expenses.toLocaleString()}</td>
                                            <td style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 600, color: profit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                                                ¥{profit.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};
