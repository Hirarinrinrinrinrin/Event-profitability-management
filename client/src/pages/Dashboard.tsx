import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Lock, AlertCircle } from 'lucide-react';

interface OpeningStats {
    id: number;
    date: string;
    location: string;
    status?: string;
    sales: number;
    cogs: number;
    expenses: number;
}

interface YearStatus {
    year: number;
    status: string; // 'open' | 'closed'
}

export const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<OpeningStats[]>([]);
    const [years, setYears] = useState<YearStatus[]>([]);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        fetchYears();
    }, []);

    useEffect(() => {
        fetchStats();
    }, [selectedYear]);

    const fetchYears = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/years');
            if (res.ok) {
                const data = await res.json();
                setYears(data);
                if (data.length > 0 && !data.find((y: any) => y.year === selectedYear)) {
                    setSelectedYear(data[0].year);
                }
            }
        } catch (e) { console.error(e); }
    };

    const fetchStats = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/openings/stats');
            if (res.ok) {
                const allStats: OpeningStats[] = await res.json();
                // Filter by selected Year
                const filtered = allStats.filter(s => new Date(s.date).getFullYear() === selectedYear);
                setStats(filtered);
            }
        } catch (e) {
            console.error(e);
        }
    };

    // Calculate Aggregates
    const totalSales = stats.reduce((sum, s) => sum + s.sales, 0);
    const totalExpenses = stats.reduce((sum, s) => sum + s.expenses, 0);
    const totalCogs = stats.reduce((sum, s) => sum + s.cogs, 0); // Cost of Goods Sold

    // Profit = Sales - COGS - Expenses
    const totalProfit = totalSales - totalCogs - totalExpenses;

    const currentYearStatus = years.find(y => y.year === selectedYear)?.status;
    const isYearClosed = currentYearStatus === 'closed';

    const handleYearClose = async () => {
        if (!window.confirm(`${selectedYear}年度を締めますか？\n締めた年度は後から編集できなくなります（実装上はまだ制限なし）。`)) return;
        try {
            const res = await fetch(`http://localhost:3001/api/years/${selectedYear}/close`, { method: 'POST' });
            if (res.ok) {
                fetchYears();
                alert(`${selectedYear}年度を締めました。`);
            }
        } catch (e) {
            console.error(e);
            alert('エラーが発生しました');
        }
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1>ダッシュボード</h1>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                        style={{ padding: '8px 16px', fontSize: '18px', borderRadius: '8px', border: '1px solid #ccc' }}
                    >
                        {years.map(y => (
                            <option key={y.year} value={y.year}>{y.year}年度 {y.status === 'closed' ? '(済)' : ''}</option>
                        ))}
                        {years.length === 0 && <option value={new Date().getFullYear()}>{new Date().getFullYear()}年度</option>}
                    </select>

                    {isYearClosed ? (
                        <div className="closed-badge" style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '8px 16px', backgroundColor: '#e5e7eb', borderRadius: '8px', color: '#6b7280', fontWeight: 'bold'
                        }}>
                            <Lock size={16} /> 年度締め済み
                        </div>
                    ) : (
                        <button
                            onClick={handleYearClose}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '8px 16px', backgroundColor: '#1f2937', color: 'white', borderRadius: '8px', cursor: 'pointer'
                            }}
                        >
                            <AlertCircle size={16} /> 年度締めを実行
                        </button>
                    )}
                </div>
            </div>

            {/* Overview Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                <div className="card" style={{ borderLeft: '6px solid var(--color-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <TrendingUp color="var(--color-primary)" />
                        <span style={{ fontSize: '18px', color: 'var(--color-text-sub)' }}>総売上</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>¥{totalSales.toLocaleString()}</div>
                </div>

                <div className="card" style={{ borderLeft: '6px solid #d48806' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <TrendingDown color="#d48806" />
                        <span style={{ fontSize: '18px', color: 'var(--color-text-sub)' }}>総原価</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>¥{totalCogs.toLocaleString()}</div>
                </div>

                <div className="card" style={{ borderLeft: '6px solid var(--color-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <TrendingDown color="var(--color-secondary)" />
                        <span style={{ fontSize: '18px', color: 'var(--color-text-sub)' }}>総経費</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold' }}>¥{totalExpenses.toLocaleString()}</div>
                </div>

                <div className="card" style={{ borderLeft: `6px solid ${totalProfit >= 0 ? '#10b981' : '#ef4444'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <DollarSign color={totalProfit >= 0 ? '#10b981' : '#ef4444'} />
                        <span style={{ fontSize: '18px', color: 'var(--color-text-sub)' }}>貢献利益</span>
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: 'bold', color: totalProfit >= 0 ? '#10b981' : '#ef4444' }}>
                        ¥{totalProfit.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Detail Table */}
            <div className="card">
                <h2>出店別サマリー</h2>
                {stats.length === 0 ? (
                    <p style={{ padding: '16px' }}>データがありません。</p>
                ) : (
                    <div className="table-container">
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>日付</th>
                                    <th style={{ padding: '12px' }}>場所</th>
                                    <th style={{ padding: '12px' }}>状態</th>
                                    <th style={{ padding: '12px' }}>売上</th>
                                    <th style={{ padding: '12px' }}>原価</th>
                                    <th style={{ padding: '12px' }}>経費</th>
                                    <th style={{ padding: '12px' }}>利益</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((s) => {
                                    const profit = s.sales - s.cogs - s.expenses;
                                    const isClosed = s.status === 'closed';
                                    return (
                                        <tr key={s.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '12px' }}>{s.date}</td>
                                            <td style={{ padding: '12px' }}>{s.location}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '99px',
                                                    fontSize: '12px',
                                                    backgroundColor: isClosed ? '#9ca3af' : '#10b981',
                                                    color: 'white',
                                                    fontWeight: 'bold'
                                                }}>
                                                    {isClosed ? '済' : '営業中'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px' }}>¥{s.sales.toLocaleString()}</td>
                                            <td style={{ padding: '12px' }}>¥{s.cogs.toLocaleString()}</td>
                                            <td style={{ padding: '12px' }}>¥{s.expenses.toLocaleString()}</td>
                                            <td style={{ padding: '12px', fontWeight: 'bold', color: profit >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
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
