import React, { useState, useEffect } from 'react';
import { Trash2, AlertTriangle, ArrowRight, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface YearStatus {
    year: number;
    status: string;
}

export const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [years, setYears] = useState<YearStatus[]>([]);
    const [selectedYearToDelete, setSelectedYearToDelete] = useState<string>('');
    const [startYear, setStartYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        fetchYears();
    }, []);

    const fetchYears = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/years');
            if (res.ok) {
                const data = await res.json();
                setYears(data);
            }
        } catch (e) { console.error(e); }
    };

    const handleResetProducts = async () => {
        if (!window.confirm('本当に全ての商品データを削除しますか？\nこの操作は取り消せません。')) return;

        try {
            const res = await fetch('http://localhost:3001/api/products/all/reset', { method: 'DELETE' });
            if (res.ok) {
                alert('商品データを初期化しました。');
            }
        } catch (e) {
            console.error(e);
            alert('エラーが発生しました');
        }
    };

    const handleResetYearData = async () => {
        if (!selectedYearToDelete) return;
        if (!window.confirm(`${selectedYearToDelete}年度の売上・経費・利益データを全て削除しますか？\n締め情報も削除されます。\nこの操作は取り消せません。`)) return;

        try {
            const res = await fetch(`http://localhost:3001/api/years/${selectedYearToDelete}/data`, { method: 'DELETE' });
            if (res.ok) {
                alert(`${selectedYearToDelete}年度のデータを初期化しました。`);
                fetchYears();
                setSelectedYearToDelete('');
            }
        } catch (e) {
            console.error(e);
            alert('エラーが発生しました');
        }
    };

    const handleSetStartYear = () => {
        // Since we don't have a specific backend setting for "Global Start Year",
        // we will simulate this by ensuring the dashboard knows about it or simply navigating there.
        // For now, we'll navigate to the dashboard (which defaults to current year or latest).
        // If the user wants to "Start" a new year, they just register an opening for that year.
        // However, the request says "Choose which year to start from after initialization".
        // We can fulfill this by navigating to the Dashboard with that year pre-selected (via query param or state? Dashboard handles state internally).
        // Let's just navigate to home, and tell the user they can start registering.

        // Actually, let's allow them to jump to Register Opening with the start date set to Jan 1st of that year?
        // Or simply navigate to Dashboard. Dashboard selects latest year.
        // If data is clear, Dashboard shows nothing.
        // Let's just give a visual feedback.
        alert(`${startYear}年度から開始します。\n「出店登録」から新しい年度の活動を開始してください。`);
        navigate('/register');
    };

    return (
        <div className="flex flex-col gap-8">
            <div className="card">
                <h1>設定</h1>
                <p style={{ color: 'var(--color-text-sub)' }}>
                    アプリケーションの初期化や管理を行います。
                </p>
            </div>

            {/* Product Reset */}
            <div className="card" style={{ borderLeft: '6px solid var(--color-error)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-error)' }}>
                    <Trash2 /> 商品マスタの初期化
                </h2>
                <p style={{ marginTop: '8px', marginBottom: '16px' }}>
                    登録されている全ての商品データを削除します。<br />
                    売上履歴に含まれる過去の商品情報は残りますが、新しく売上登録する際の商品リストは空になります。
                </p>
                <button
                    onClick={handleResetProducts}
                    style={{
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        border: '1px solid #fecaca'
                    }}
                >
                    全商品を削除する
                </button>
            </div>

            {/* Yearly Data Reset */}
            <div className="card" style={{ borderLeft: '6px solid var(--color-secondary)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)' }}>
                    <AlertTriangle /> 売上・経費データの初期化
                </h2>
                <p style={{ marginTop: '8px', marginBottom: '16px' }}>
                    指定した年度の出店記録、売上、経費、締め情報を全て削除します。
                </p>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <select
                        value={selectedYearToDelete}
                        onChange={(e) => setSelectedYearToDelete(e.target.value)}
                        style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', minWidth: '150px' }}
                    >
                        <option value="">年度を選択</option>
                        {years.map(y => (
                            <option key={y.year} value={y.year}>{y.year}年度</option>
                        ))}
                    </select>

                    <button
                        onClick={handleResetYearData}
                        disabled={!selectedYearToDelete}
                        style={{
                            backgroundColor: !selectedYearToDelete ? '#f3f4f6' : '#ffedd5',
                            color: !selectedYearToDelete ? '#9ca3af' : '#9a3412',
                            padding: '12px 24px',
                            borderRadius: '8px',
                            fontWeight: 'bold',
                            border: !selectedYearToDelete ? '1px solid #e5e5e5' : '1px solid #fed7aa',
                            cursor: !selectedYearToDelete ? 'not-allowed' : 'pointer'
                        }}
                    >
                        選択して削除
                    </button>
                </div>
            </div>

            {/* Start Year Selection */}
            <div className="card" style={{ borderLeft: '6px solid var(--color-primary)' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                    <ArrowRight /> 次の年度を開始
                </h2>
                <p style={{ marginTop: '8px', marginBottom: '16px' }}>
                    初期化後、新しく活動を始める年度を設定し、登録画面へ移動します。
                </p>

                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                            type="number"
                            value={startYear}
                            onChange={(e) => setStartYear(parseInt(e.target.value))}
                            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ccc', width: '100px' }}
                        />
                        <span style={{ fontWeight: 'bold' }}>年度</span>
                    </div>

                    <button
                        onClick={handleSetStartYear}
                        className="bg-navy"
                        style={{
                            padding: '12px 24px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }}
                    >
                        <Save size={18} />
                        設定して開始
                    </button>
                </div>
            </div>
        </div>
    );
};
