import React, { useState, useEffect } from 'react';
import { PlusCircle, MinusCircle, Trash2, User, Fuel, Store, HelpCircle, Lock, CheckCircle } from 'lucide-react';
import * as db from '../db';

const EXPENSE_CATEGORIES = [
    { id: 'labor', name: '人件費', icon: User },
    { id: 'gas', name: 'ガソリン代', icon: Fuel },
    { id: 'rent', name: '出店料', icon: Store },
    { id: 'other', name: 'その他', icon: HelpCircle },
];

export const InputTransactions: React.FC = () => {
    const [openings, setOpenings] = useState<db.Opening[]>([]);
    const [products, setProducts] = useState<db.Product[]>([]);
    const [selectedOpeningId, setSelectedOpeningId] = useState<string>('');
    const [transactions, setTransactions] = useState<db.Transaction[]>([]);

    // Forms
    const [salesForm, setSalesForm] = useState({ productId: '', quantity: 1, price: '' });
    // Set Menu State
    const [salesMode, setSalesMode] = useState<'single' | 'set'>('single');
    const [setForm, setSetForm] = useState({
        name: '',
        price: '',
        quantity: 1,
        selectedProductIds: [] as number[]
    });

    // Expense Form State
    const [expenseCategory, setExpenseCategory] = useState<string>('labor');
    const [expenseForm, setExpenseForm] = useState({ item_name: '', amount: '' });

    // Rent specific state
    const [rentType, setRentType] = useState<'fixed' | 'rate'>('fixed');
    const [rentRate, setRentRate] = useState<string>('');
    const [gasMethod, setGasMethod] = useState<'direct' | 'calc'>('direct');
    const [gasDistance, setGasDistance] = useState<string>('');
    const [gasPricePerLiter, setGasPricePerLiter] = useState<string>('');

    useEffect(() => {
        fetchOpenings();
        fetchProducts();
    }, []);

    useEffect(() => {
        if (selectedOpeningId) {
            fetchTransactions(selectedOpeningId);
        } else {
            setTransactions([]);
        }
    }, [selectedOpeningId]);

    const fetchOpenings = async () => {
        try {
            const data = await db.getOpenings();
            setOpenings(data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchProducts = async () => {
        try {
            const data = await db.getProducts();
            setProducts(data);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchTransactions = async (openingId: string) => {
        try {
            const data = await db.getTransactions(parseInt(openingId));
            setTransactions(data);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddSales = async (e: React.FormEvent) => {
        e.preventDefault();

        if (salesMode === 'single') {
            if (!selectedOpeningId || !salesForm.productId || !salesForm.price) return;

            const product = products.find(p => p.id === parseInt(salesForm.productId));
            if (!product) return;

            await saveTransaction({
                opening_id: parseInt(selectedOpeningId),
                type: 'sales',
                item_name: product.name,
                amount: parseInt(salesForm.price),
                cost: product.cost_price,
                quantity: salesForm.quantity
            });
            setSalesForm({ productId: '', quantity: 1, price: '' });

        } else {
            // Set Mode
            if (!selectedOpeningId || !setForm.name || !setForm.price || setForm.selectedProductIds.length === 0) return;

            const totalSetCost = setForm.selectedProductIds.reduce((sum, id) => {
                const product = products.find(p => p.id === id);
                return sum + (product ? product.cost_price : 0);
            }, 0);

            await saveTransaction({
                opening_id: parseInt(selectedOpeningId),
                type: 'sales',
                item_name: setForm.name,
                amount: parseInt(setForm.price),
                cost: totalSetCost,
                quantity: setForm.quantity
            });

            setSetForm({
                name: '',
                price: '',
                quantity: 1,
                selectedProductIds: []
            });
        }
    };

    const toggleSetProduct = (id: number) => {
        setSetForm(prev => {
            const isSelected = prev.selectedProductIds.includes(id);
            if (isSelected) {
                return { ...prev, selectedProductIds: prev.selectedProductIds.filter(pid => pid !== id) };
            } else {
                return { ...prev, selectedProductIds: [...prev.selectedProductIds, id] };
            }
        });
    };

    const handleAddExpense = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOpeningId) return;

        let finalItemName = '';
        let finalAmount = parseInt(expenseForm.amount);

        if (expenseCategory === 'other') {
            finalItemName = expenseForm.item_name || 'その他';
        } else if (expenseCategory === 'rent') {
            finalItemName = '出店料';
            if (rentType === 'rate') {
                const rate = parseFloat(rentRate);
                if (!isNaN(rate)) {
                    finalAmount = Math.floor(totalSales * (rate / 100));
                    finalItemName = `出店料 (${rate}%)`;
                }
            }
        } else if (expenseCategory === 'gas') {
            finalItemName = 'ガソリン代';
            if (gasMethod === 'calc') {
                const dist = parseFloat(gasDistance);
                const price = parseFloat(gasPricePerLiter);
                if (!isNaN(dist) && !isNaN(price)) {
                    const totalDist = dist * 2;
                    finalAmount = Math.floor(totalDist * (price / 15));
                    finalItemName = `ガソリン代 (往復${totalDist}km @ ¥${price}/L)`;
                }
            }
        } else {
            const category = EXPENSE_CATEGORIES.find(c => c.id === expenseCategory);
            finalItemName = category ? category.name : '経費';
        }

        await saveTransaction({
            opening_id: parseInt(selectedOpeningId),
            type: 'expense',
            item_name: finalItemName,
            amount: finalAmount,
            cost: 0,
            quantity: 1
        });
        setExpenseForm({ item_name: '', amount: '' });
        setRentRate('');
        setGasDistance('');
        setGasPricePerLiter('');
    };

    const saveTransaction = async (data: {
        opening_id: number;
        type: 'sales' | 'expense';
        item_name: string;
        amount: number;
        cost: number;
        quantity: number;
    }) => {
        try {
            await db.addTransaction(data);
            fetchTransactions(selectedOpeningId);
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('この項目を削除しますか？')) return;
        try {
            await db.deleteTransaction(id);
            fetchTransactions(selectedOpeningId);
        } catch (error) {
            console.error(error);
        }
    };

    const handleCloseEvent = async () => {
        if (!window.confirm('この出店を「締め」ますか？\n締めると、以降は編集ができなくなります。')) return;

        try {
            await db.closeOpening(parseInt(selectedOpeningId));
            setOpenings(prev => prev.map(op =>
                op.id === parseInt(selectedOpeningId) ? { ...op, status: 'closed' } : op
            ));
            alert('締め処理が完了しました。');
        } catch (e) {
            console.error(e);
            alert('エラーが発生しました');
        }
    }

    // Find currently selected opening object
    const currentOpening = openings.find(op => op.id.toString() === selectedOpeningId);
    const isClosed = currentOpening?.status === 'closed';

    // Calculations
    const totalSales = transactions
        .filter(t => t.type === 'sales')
        .reduce((sum, t) => sum + (t.amount * t.quantity), 0);

    const totalCostOfGoods = transactions
        .filter(t => t.type === 'sales')
        .reduce((sum, t) => sum + ((t.cost || 0) * t.quantity), 0);

    const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const profit = totalSales - totalCostOfGoods - totalExpenses;

    // Rent Calculation Helper
    const calculatedRent = rentRate ? Math.floor(totalSales * (parseFloat(rentRate) / 100)) : 0;

    // Set Cost Preview
    const currentSetCost = setForm.selectedProductIds.reduce((sum, id) => {
        const product = products.find(p => p.id === id);
        return sum + (product ? product.cost_price : 0);
    }, 0);

    return (
        <div className="flex flex-col gap-8">
            <div className="card">
                <h1>売上・経費入力</h1>
                <p style={{ color: 'var(--color-text-sub)' }}>
                    出店を選択して、売上と経費を入力してください。
                </p>

                <div style={{ marginTop: '24px' }}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: '8px' }}>出店を選択</label>
                    <select
                        value={selectedOpeningId}
                        onChange={(e) => setSelectedOpeningId(e.target.value)}
                        style={{ padding: '12px', fontSize: '18px', width: '100%', maxWidth: '400px', borderRadius: '8px', border: '1px solid var(--color-border)' }}
                    >
                        <option value="">選択してください</option>
                        {openings.filter(op => op.status !== 'closed').map(op => (
                            <option key={op.id} value={op.id}>
                                {op.date} - {op.location}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {selectedOpeningId && currentOpening && (
                <>
                    {/* Status & Close Button */}
                    <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isClosed ? '#f3f4f6' : 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                                padding: '6px 12px',
                                borderRadius: '99px',
                                color: 'white',
                                backgroundColor: isClosed ? '#9ca3af' : '#10b981',
                                fontWeight: 'bold',
                                fontSize: '14px',
                                display: 'flex', alignItems: 'center', gap: '4px'
                            }}>
                                {isClosed ? <Lock size={14} /> : <CheckCircle size={14} />}
                                {isClosed ? '締め済み' : '営業中'}
                            </div>
                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{currentOpening.date} @ {currentOpening.location}</span>
                        </div>

                        {!isClosed && (
                            <button
                                onClick={handleCloseEvent}
                                style={{
                                    backgroundColor: '#1f2937',
                                    color: 'white',
                                    padding: '10px 20px',
                                    borderRadius: '8px',
                                    display: 'flex', alignItems: 'center', gap: '8px'
                                }}>
                                <Lock size={16} /> 本日の営業を締める
                            </button>
                        )}
                    </div>

                    {/* Summary Board */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                        <div className="card" style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}>
                            <div style={{ fontSize: '16px', color: '#1e40af' }}>総売上</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1e3a8a' }}>¥{totalSales.toLocaleString()}</div>
                        </div>
                        <div className="card" style={{ backgroundColor: '#fffbe6', border: '1px solid #ffe58f' }}>
                            <div style={{ fontSize: '16px', color: '#d48806' }}>総原価</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ad6800' }}>¥{totalCostOfGoods.toLocaleString()}</div>
                        </div>
                        <div className="card" style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa' }}>
                            <div style={{ fontSize: '16px', color: '#9a3412' }}>総経費</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#7c2d12' }}>¥{totalExpenses.toLocaleString()}</div>
                        </div>
                        <div className="card" style={{ backgroundColor: profit >= 0 ? '#f0fdf4' : '#fef2f2', border: `1px solid ${profit >= 0 ? '#bbf7d0' : '#fecaca'}` }}>
                            <div style={{ fontSize: '16px', color: profit >= 0 ? '#166534' : '#991b1b' }}>貢献利益</div>
                            <div style={{ fontSize: '28px', fontWeight: 'bold', color: profit >= 0 ? '#14532d' : '#7f1d1d' }}>¥{profit.toLocaleString()}</div>
                        </div>
                    </div>

                    {!isClosed ? (
                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                            {/* Sales Input */}
                            <div className="card flex-1" style={{ minWidth: '300px' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-primary)' }}>
                                    <PlusCircle /> 売上登録
                                </h2>
                                <form onSubmit={handleAddSales} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* Mode Selection */}
                                    <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                checked={salesMode === 'single'}
                                                onChange={() => setSalesMode('single')}
                                            /> 単品
                                        </label>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                            <input
                                                type="radio"
                                                checked={salesMode === 'set'}
                                                onChange={() => setSalesMode('set')}
                                            /> セット
                                        </label>
                                    </div>

                                    {salesMode === 'single' ? (
                                        <>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '4px' }}>商品</label>
                                                <select
                                                    value={salesForm.productId}
                                                    onChange={(e) => setSalesForm({ ...salesForm, productId: e.target.value })}
                                                    required
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                >
                                                    <option value="">商品を選択</option>
                                                    {products.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '4px' }}>販売単価 (円)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    value={salesForm.price}
                                                    onChange={(e) => setSalesForm({ ...salesForm, price: e.target.value })}
                                                    required
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '4px' }}>数量</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={salesForm.quantity}
                                                    onChange={(e) => setSalesForm({ ...salesForm, quantity: parseInt(e.target.value) })}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '4px' }}>セット名</label>
                                                <input
                                                    type="text"
                                                    placeholder="例: 得々セット"
                                                    value={setForm.name}
                                                    onChange={(e) => setSetForm({ ...setForm, name: e.target.value })}
                                                    required
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '4px' }}>構成商品 (原価計算用)</label>
                                                <div style={{
                                                    maxHeight: '150px',
                                                    overflowY: 'auto',
                                                    border: '1px solid #ccc',
                                                    borderRadius: '4px',
                                                    padding: '8px'
                                                }}>
                                                    {products.map(p => (
                                                        <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0', cursor: 'pointer' }}>
                                                            <input
                                                                type="checkbox"
                                                                checked={setForm.selectedProductIds.includes(p.id)}
                                                                onChange={() => toggleSetProduct(p.id)}
                                                            />
                                                            <span>{p.name} (原価: ¥{p.cost_price})</span>
                                                        </label>
                                                    ))}
                                                </div>
                                                <div style={{ textAlign: 'right', fontSize: '14px', color: '#666', marginTop: '4px' }}>
                                                    原価合計: <strong>¥{currentSetCost}</strong>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '4px' }}>セット販売価格 (円)</label>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    placeholder="0"
                                                    value={setForm.price}
                                                    onChange={(e) => setSetForm({ ...setForm, price: e.target.value })}
                                                    required
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                />
                                            </div>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '4px' }}>数量</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={setForm.quantity}
                                                    onChange={(e) => setSetForm({ ...setForm, quantity: parseInt(e.target.value) })}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                />
                                            </div>
                                        </>
                                    )}
                                    <button type="submit" className="bg-navy" style={{ padding: '12px' }}>売上に追加</button>
                                </form>
                            </div>

                            {/* Expense Input */}
                            <div className="card flex-1" style={{ minWidth: '300px' }}>
                                <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-secondary)' }}>
                                    <MinusCircle /> 経費登録
                                </h2>
                                <form onSubmit={handleAddExpense} style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                    {/* Visual Category Selection */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                        {EXPENSE_CATEGORIES.map(cat => (
                                            <button
                                                key={cat.id}
                                                type="button"
                                                onClick={() => setExpenseCategory(cat.id)}
                                                style={{
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    border: expenseCategory === cat.id ? '2px solid var(--color-secondary)' : '1px solid #e5e5e5',
                                                    backgroundColor: expenseCategory === cat.id ? '#fff7ed' : 'white',
                                                    color: expenseCategory === cat.id ? 'var(--color-secondary)' : '#666',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    cursor: 'pointer',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                <cat.icon size={20} />
                                                {cat.name}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Opening Fee Specific UI */}
                                    {expenseCategory === 'rent' && (
                                        <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>計算方法</label>
                                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        checked={rentType === 'fixed'}
                                                        onChange={() => setRentType('fixed')}
                                                        name="rentType"
                                                    /> 定額（円）
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        checked={rentType === 'rate'}
                                                        onChange={() => setRentType('rate')}
                                                        name="rentType"
                                                    /> 定率（売上の%）
                                                </label>
                                            </div>

                                            {rentType === 'rate' && (
                                                <div>
                                                    <label style={{ display: 'block', marginBottom: '4px' }}>出店料率 (%)</label>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            step="0.1"
                                                            placeholder="例: 15"
                                                            value={rentRate}
                                                            onChange={(e) => setRentRate(e.target.value)}
                                                            style={{ width: '80px', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                        />
                                                        <span>%</span>
                                                    </div>
                                                    <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                                                        現在の売上 ¥{totalSales.toLocaleString()} × {rentRate || 0}% = <strong>¥{calculatedRent.toLocaleString()}</strong>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {expenseCategory === 'gas' && (
                                        <div style={{ marginTop: '8px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>登録方法</label>
                                            <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        checked={gasMethod === 'direct'}
                                                        onChange={() => setGasMethod('direct')}
                                                        name="gasMethod"
                                                    /> 金額直接入力
                                                </label>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                                    <input
                                                        type="radio"
                                                        checked={gasMethod === 'calc'}
                                                        onChange={() => setGasMethod('calc')}
                                                        name="gasMethod"
                                                    /> 距離から計算
                                                </label>
                                            </div>

                                            {gasMethod === 'calc' && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '4px' }}>片道距離 (km)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            placeholder="0"
                                                            value={gasDistance}
                                                            onChange={(e) => setGasDistance(e.target.value)}
                                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label style={{ display: 'block', marginBottom: '4px' }}>ガソリン単価 (円/L)</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            placeholder="0"
                                                            value={gasPricePerLiter}
                                                            onChange={(e) => setGasPricePerLiter(e.target.value)}
                                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                                        />
                                                    </div>

                                                    {gasDistance && gasPricePerLiter && (
                                                        <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                                                            (片道 {gasDistance}km × 2) × ({gasPricePerLiter}円 ÷ 15km/L) = <strong>¥{Math.floor((parseFloat(gasDistance) * 2) * (parseFloat(gasPricePerLiter) / 15)).toLocaleString()}</strong>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {expenseCategory === 'other' && (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '4px' }}>経費内容</label>
                                            <input
                                                type="text"
                                                placeholder="内容を入力"
                                                value={expenseForm.item_name}
                                                onChange={(e) => setExpenseForm({ ...expenseForm, item_name: e.target.value })}
                                                required={expenseCategory === 'other'}
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                            />
                                        </div>
                                    )}

                                    {/* Amount Input */}
                                    {!((expenseCategory === 'rent' && rentType === 'rate') || (expenseCategory === 'gas' && gasMethod === 'calc')) && (
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '4px' }}>金額 (円)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                value={expenseForm.amount}
                                                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                                required={!((expenseCategory === 'rent' && rentType === 'rate') || (expenseCategory === 'gas' && gasMethod === 'calc'))}
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                                            />
                                        </div>
                                    )}

                                    <button type="submit" style={{ padding: '12px', backgroundColor: 'var(--color-secondary)', color: 'white' }}>経費に追加</button>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="card" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                            <Lock size={48} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
                            <h2>この出店は締め済みです</h2>
                            <p>売上や経費の追加・編集はできません。</p>
                        </div>
                    )}

                    {/* Transaction History */}
                    <div className="card">
                        <h2>履歴</h2>
                        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left' }}>
                                    <th style={{ padding: '10px' }}>種類</th>
                                    <th style={{ padding: '10px' }}>項目</th>
                                    <th style={{ padding: '10px' }}>単価/金額</th>
                                    <th style={{ padding: '10px' }}>数量</th>
                                    <th style={{ padding: '10px' }}>小計</th>
                                    <th style={{ padding: '10px' }}>操作</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map(t => (
                                    <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '10px' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '14px',
                                                backgroundColor: t.type === 'sales' ? '#d1fae5' : '#ffedd5',
                                                color: t.type === 'sales' ? '#065f46' : '#9a3412'
                                            }}>
                                                {t.type === 'sales' ? '売上' : '経費'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '10px' }}>{t.item_name}</td>
                                        <td style={{ padding: '10px' }}>¥{t.amount.toLocaleString()}</td>
                                        <td style={{ padding: '10px' }}>{t.quantity > 1 ? t.quantity : '-'}</td>
                                        <td style={{ padding: '10px', fontWeight: 'bold' }}>
                                            ¥{(t.amount * (t.quantity || 1)).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '10px' }}>
                                            {!isClosed && (
                                                <button
                                                    onClick={() => handleDelete(t.id)}
                                                    style={{ padding: '8px', color: 'var(--color-error)', backgroundColor: 'transparent' }}
                                                    title="削除"
                                                >
                                                    <Trash2 size={20} />
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
};
