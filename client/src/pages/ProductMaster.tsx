import React, { useState, useEffect } from 'react';
import { Trash2, Edit2, X } from 'lucide-react';
import * as db from '../db';

export const ProductMaster: React.FC = () => {
    const [products, setProducts] = useState<db.Product[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        cost_price: ''
    });
    const [editingId, setEditingId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const data = await db.getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await db.updateProduct(editingId, formData.name, parseInt(formData.cost_price));
            } else {
                await db.addProduct(formData.name, parseInt(formData.cost_price));
            }
            setFormData({ name: '', cost_price: '' });
            setEditingId(null);
            fetchProducts();
        } catch (error) {
            console.error('Failed to save product', error);
        }
    };

    const handleEdit = (product: db.Product) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            cost_price: product.cost_price.toString()
        });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({ name: '', cost_price: '' });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('この商品を削除しますか？')) return;
        try {
            await db.deleteProduct(id);
            fetchProducts();
        } catch (error) {
            console.error('Failed to delete product', error);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '28px 32px' }}>
            <div className="card">
                <h1 style={{ fontSize: '20px' }}>商品マスタ管理</h1>
                <p style={{ color: 'var(--color-text-sub)' }}>
                    販売する商品とその原価を登録します。
                </p>

                <form onSubmit={handleSubmit} style={{ marginTop: '24px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div className="flex flex-col gap-2">
                        <label style={{ fontWeight: 600 }}>商品名</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="例: チーズバーガー"
                            required
                            style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--color-border)', width: '200px' }}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label style={{ fontWeight: 600 }}>原価 (円)</label>
                        <input
                            type="number"
                            name="cost_price"
                            value={formData.cost_price}
                            onChange={handleChange}
                            placeholder="0"
                            required
                            style={{ padding: '10px', borderRadius: '4px', border: '1px solid var(--color-border)', width: '120px' }}
                        />
                    </div>
                    <button type="submit" className="bg-navy" style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {editingId ? <><Edit2 size={18} /> 更新</> : '追加'}
                    </button>
                    {editingId && (
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            style={{
                                padding: '10px 16px',
                                backgroundColor: '#f3f4f6',
                                color: '#4b5563',
                                borderRadius: '4px',
                                border: '1px solid #d1d5db',
                                display: 'flex', alignItems: 'center', gap: '8px'
                            }}
                        >
                            <X size={18} /> キャンセル
                        </button>
                    )}
                </form>
            </div>

            <div className="card">
                <h2>登録済み商品一覧</h2>
                {loading ? (
                    <p>読み込み中...</p>
                ) : products.length === 0 ? (
                    <p>登録された商品はありません。</p>
                ) : (
                    <div className="table-container">
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px' }}>商品名</th>
                                    <th style={{ padding: '12px' }}>原価</th>
                                    <th style={{ padding: '12px' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => {
                                    return (
                                        <tr key={product.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                            <td style={{ padding: '9px 12px' }}>{product.name}</td>
                                            <td style={{ padding: '9px 12px' }}>¥{product.cost_price.toLocaleString()}</td>
                                            <td style={{ padding: '9px 12px' }}>
                                                <button
                                                    onClick={() => handleDelete(product.id)}
                                                    style={{ padding: '8px', color: 'var(--color-error)', backgroundColor: 'transparent' }}
                                                    title="削除"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    style={{ padding: '8px', color: 'var(--color-primary)', backgroundColor: 'transparent', marginLeft: '8px' }}
                                                    title="編集"
                                                >
                                                    <Edit2 size={20} />
                                                </button>
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
