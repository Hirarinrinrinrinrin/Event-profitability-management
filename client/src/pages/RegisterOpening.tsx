import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, Trash2, Edit2, X } from 'lucide-react';
import * as db from '../db';

export const RegisterOpening: React.FC = () => {
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        location: '',
        start_time: '10:00',
        end_time: '17:00'
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [status, setStatus] = useState<string | null>(null);
    const [openings, setOpenings] = useState<db.Opening[]>([]);

    useEffect(() => {
        fetchOpenings();
    }, []);

    const fetchOpenings = async () => {
        try {
            const data = await db.getOpenings();
            setOpenings(data.filter(op => op.status !== 'closed'));
        } catch (e) { console.error(e); }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('saving');
        try {
            if (editingId) {
                await db.updateOpening(editingId, formData);
                setStatus('updated');
            } else {
                await db.addOpening(formData);
                setStatus('registered');
            }
            setEditingId(null);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                location: '',
                start_time: '10:00',
                end_time: '17:00'
            });
            fetchOpenings();
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    const handleEdit = (op: db.Opening) => {
        setEditingId(op.id);
        setFormData({
            date: op.date,
            location: op.location,
            start_time: op.start_time,
            end_time: op.end_time
        });
        setStatus(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            location: '',
            start_time: '10:00',
            end_time: '17:00'
        });
        setStatus(null);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('この出店予定を削除しますか？\n関連する売上・経費データも削除されます。')) return;
        try {
            await db.deleteOpening(id);
            fetchOpenings();
        } catch (e) { console.error(e); }
    };

    return (
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px 32px' }}>
            <div className="card">
                <h1 style={{ fontSize: '20px' }}>出店登録</h1>
                <p style={{ marginTop: '6px', marginBottom: '20px', fontSize: '13px', color: 'var(--color-text-sub)' }}>
                    新しい出店スケジュールを登録します。
                </p>

                {(status === 'registered' || status === 'updated') && (
                    <div style={{ backgroundColor: '#d1fae5', color: '#065f46', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                        {status === 'updated' ? '更新しました！' : '登録しました！'}
                    </div>
                )}

                {status === 'error' && (
                    <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                        エラーが発生しました。
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="flex flex-col" style={{ gap: '8px' }}>
                        <label style={{ fontWeight: 600 }}>日付</label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            style={{ padding: '9px 11px', borderRadius: '8px', border: '1px solid var(--color-border)', width: '100%' }}
                        />
                    </div>

                    <div className="flex flex-col" style={{ gap: '8px' }}>
                        <label style={{ fontWeight: 600 }}>場所</label>
                        <input
                            type="text"
                            name="location"
                            value={formData.location}
                            onChange={handleChange}
                            placeholder="例: OO公園イベント"
                            required
                            style={{ padding: '9px 11px', borderRadius: '8px', border: '1px solid var(--color-border)', width: '100%' }}
                        />
                    </div>

                    <div className="flex" style={{ gap: '16px' }}>
                        <div className="flex flex-col flex-1" style={{ gap: '8px' }}>
                            <label style={{ fontWeight: 600 }}>開始時間</label>
                            <input
                                type="time"
                                name="start_time"
                                value={formData.start_time}
                                onChange={handleChange}
                                style={{ padding: '9px 11px', borderRadius: '8px', border: '1px solid var(--color-border)', width: '100%' }}
                            />
                        </div>
                        <div className="flex flex-col flex-1" style={{ gap: '8px' }}>
                            <label style={{ fontWeight: 600 }}>終了時間</label>
                            <input
                                type="time"
                                name="end_time"
                                value={formData.end_time}
                                onChange={handleChange}
                                style={{ padding: '9px 11px', borderRadius: '8px', border: '1px solid var(--color-border)', width: '100%' }}
                            />
                        </div>
                    </div>

                    <button type="submit" className="bg-navy" style={{ marginTop: '12px', padding: '9px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                        {editingId ? <><Edit2 /> 更新する</> : '登録する'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            style={{ padding: '9px 16px', backgroundColor: '#f1f5f9', color: '#64748b', borderRadius: '8px', border: '1px solid var(--color-border)', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                        >
                            <X /> キャンセル
                        </button>
                    )}
                </form>
            </div>

            <div className="card">
                <h2>登録済み出店予定 (未締め)</h2>
                {openings.length === 0 ? (
                    <p style={{ color: '#666' }}>予定されている出店はありません。</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                        {openings.map(op => (
                            <div key={op.id} style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', backgroundColor: '#f8fafc' }}>
                                <div style={{ fontWeight: 600, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Calendar size={15} /> {op.date}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', color: 'var(--color-text-sub)', fontSize: '13px' }}>
                                    <MapPin size={13} /> {op.location}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', color: 'var(--color-text-sub)', fontSize: '13px' }}>
                                    <Clock size={13} /> {op.start_time} - {op.end_time}
                                </div>

                                <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' }}>
                                    <button
                                        onClick={() => handleEdit(op)}
                                        style={{ flex: 1, padding: '8px', backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                    >
                                        <Edit2 size={16} /> 編集
                                    </button>
                                    <button
                                        onClick={() => handleDelete(op.id)}
                                        style={{ flex: 1, padding: '8px', backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={16} /> 削除
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
