import localforage from 'localforage';

// --- Types ---
export interface Product {
    id: number;
    name: string;
    cost_price: number;
}

export interface Opening {
    id: number;
    date: string;
    location: string;
    start_time: string;
    end_time: string;
    status: string; // 'open' | 'closed'
}

export interface Transaction {
    id: number;
    opening_id: number;
    type: 'sales' | 'expense';
    item_name: string;
    amount: number;
    cost: number;
    quantity: number;
}

export interface YearlyClosing {
    year: number;
    status: string;
    closed_at: string;
}

export interface OpeningStats {
    id: number;
    date: string;
    location: string;
    status?: string;
    sales: number;
    cogs: number;
    expenses: number;
}

export interface YearStatus {
    year: number;
    status: string;
}

// --- Stores ---
const productsStore = localforage.createInstance({ name: 'app-db', storeName: 'products' });
const openingsStore = localforage.createInstance({ name: 'app-db', storeName: 'openings' });
const transactionsStore = localforage.createInstance({ name: 'app-db', storeName: 'transactions' });
const yearlyClosingsStore = localforage.createInstance({ name: 'app-db', storeName: 'yearly_closings' });
const metaStore = localforage.createInstance({ name: 'app-db', storeName: 'meta' });

// --- ID Generation ---
async function getNextId(storeName: string): Promise<number> {
    const key = `nextId_${storeName}`;
    const current = await metaStore.getItem<number>(key);
    const nextId = (current || 0) + 1;
    await metaStore.setItem(key, nextId);
    return nextId;
}

// --- Helper: get all items from a store ---
async function getAllItems<T>(store: LocalForage): Promise<T[]> {
    const items: T[] = [];
    await store.iterate<T, void>((value) => {
        items.push(value);
    });
    return items;
}

// ==========================================
// Products API
// ==========================================

export async function getProducts(): Promise<Product[]> {
    const products = await getAllItems<Product>(productsStore);
    return products.sort((a, b) => b.id - a.id);
}

export async function addProduct(name: string, cost_price: number): Promise<Product> {
    const id = await getNextId('products');
    const product: Product = { id, name, cost_price };
    await productsStore.setItem(String(id), product);
    return product;
}

export async function updateProduct(id: number, name: string, cost_price: number): Promise<void> {
    const product: Product = { id, name, cost_price };
    await productsStore.setItem(String(id), product);
}

export async function deleteProduct(id: number): Promise<void> {
    await productsStore.removeItem(String(id));
}

export async function resetProducts(): Promise<void> {
    await productsStore.clear();
    await metaStore.setItem('nextId_products', 0);
}

// ==========================================
// Openings API
// ==========================================

export async function getOpenings(): Promise<Opening[]> {
    const openings = await getAllItems<Opening>(openingsStore);
    return openings.sort((a, b) => b.date.localeCompare(a.date));
}

export async function addOpening(data: { date: string; location: string; start_time: string; end_time: string }): Promise<Opening> {
    const id = await getNextId('openings');
    const opening: Opening = { id, ...data, status: 'open' };
    await openingsStore.setItem(String(id), opening);
    return opening;
}

export async function updateOpening(id: number, data: { date: string; location: string; start_time: string; end_time: string }): Promise<void> {
    const existing = await openingsStore.getItem<Opening>(String(id));
    if (existing) {
        const updated: Opening = { ...existing, ...data };
        await openingsStore.setItem(String(id), updated);
    }
}

export async function deleteOpening(id: number): Promise<void> {
    // Delete associated transactions first
    const transactions = await getAllItems<Transaction>(transactionsStore);
    for (const t of transactions) {
        if (t.opening_id === id) {
            await transactionsStore.removeItem(String(t.id));
        }
    }
    await openingsStore.removeItem(String(id));
}

export async function closeOpening(id: number): Promise<void> {
    const existing = await openingsStore.getItem<Opening>(String(id));
    if (existing) {
        existing.status = 'closed';
        await openingsStore.setItem(String(id), existing);
    }
}

// ==========================================
// Openings Stats (replaces SQL JOIN query)
// ==========================================

export async function getOpeningsStats(): Promise<OpeningStats[]> {
    const openings = await getAllItems<Opening>(openingsStore);
    const transactions = await getAllItems<Transaction>(transactionsStore);

    const stats: OpeningStats[] = openings.map(o => {
        const openingTxns = transactions.filter(t => t.opening_id === o.id);

        const sales = openingTxns
            .filter(t => t.type === 'sales')
            .reduce((sum, t) => sum + t.amount * t.quantity, 0);

        const cogs = openingTxns
            .filter(t => t.type === 'sales')
            .reduce((sum, t) => sum + t.cost * t.quantity, 0);

        const expenses = openingTxns
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            id: o.id,
            date: o.date,
            location: o.location,
            status: o.status,
            sales,
            cogs,
            expenses,
        };
    });

    return stats.sort((a, b) => b.date.localeCompare(a.date));
}

// ==========================================
// Transactions API
// ==========================================

export async function getTransactions(openingId: number): Promise<Transaction[]> {
    const transactions = await getAllItems<Transaction>(transactionsStore);
    return transactions
        .filter(t => t.opening_id === openingId)
        .sort((a, b) => b.id - a.id);
}

export async function addTransaction(data: {
    opening_id: number;
    type: 'sales' | 'expense';
    item_name: string;
    amount: number;
    cost: number;
    quantity: number;
}): Promise<Transaction> {
    const id = await getNextId('transactions');
    const transaction: Transaction = { id, ...data };
    await transactionsStore.setItem(String(id), transaction);
    return transaction;
}

export async function deleteTransaction(id: number): Promise<void> {
    await transactionsStore.removeItem(String(id));
}

// ==========================================
// Yearly Closings API
// ==========================================

export async function getYears(): Promise<YearStatus[]> {
    const openings = await getAllItems<Opening>(openingsStore);
    const closings = await getAllItems<YearlyClosing>(yearlyClosingsStore);

    // Get distinct years from openings
    const yearSet = new Set<number>();
    openings.forEach(o => {
        if (o.date) {
            const year = new Date(o.date).getFullYear();
            if (!isNaN(year)) yearSet.add(year);
        }
    });

    const years: YearStatus[] = Array.from(yearSet)
        .sort((a, b) => b - a)
        .map(year => {
            const closing = closings.find(c => c.year === year);
            return {
                year,
                status: closing ? closing.status : 'open',
            };
        });

    return years;
}

export async function closeYear(year: number): Promise<void> {
    const closing: YearlyClosing = {
        year,
        status: 'closed',
        closed_at: new Date().toISOString(),
    };
    await yearlyClosingsStore.setItem(String(year), closing);
}

export async function deleteYearData(year: number): Promise<void> {
    // 1. Get openings for the year
    const openings = await getAllItems<Opening>(openingsStore);
    const yearOpenings = openings.filter(o => {
        if (!o.date) return false;
        return new Date(o.date).getFullYear() === year;
    });

    // 2. Delete transactions for those openings
    const transactions = await getAllItems<Transaction>(transactionsStore);
    for (const t of transactions) {
        if (yearOpenings.some(o => o.id === t.opening_id)) {
            await transactionsStore.removeItem(String(t.id));
        }
    }

    // 3. Delete openings
    for (const o of yearOpenings) {
        await openingsStore.removeItem(String(o.id));
    }

    // 4. Delete yearly closing status
    await yearlyClosingsStore.removeItem(String(year));
}

// ==========================================
// Backup & Restore (for Settings page)
// ==========================================

export async function exportAllData(): Promise<string> {
    const data = {
        products: await getAllItems<Product>(productsStore),
        openings: await getAllItems<Opening>(openingsStore),
        transactions: await getAllItems<Transaction>(transactionsStore),
        yearlyClosings: await getAllItems<YearlyClosing>(yearlyClosingsStore),
        meta: {} as Record<string, number>,
    };

    // Export meta IDs
    const metaKeys = ['nextId_products', 'nextId_openings', 'nextId_transactions'];
    for (const key of metaKeys) {
        const val = await metaStore.getItem<number>(key);
        if (val !== null) data.meta[key] = val;
    }

    return JSON.stringify(data, null, 2);
}

export async function importAllData(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);

    // Clear all stores
    await productsStore.clear();
    await openingsStore.clear();
    await transactionsStore.clear();
    await yearlyClosingsStore.clear();

    // Import products
    if (data.products) {
        for (const p of data.products) {
            await productsStore.setItem(String(p.id), p);
        }
    }

    // Import openings
    if (data.openings) {
        for (const o of data.openings) {
            await openingsStore.setItem(String(o.id), o);
        }
    }

    // Import transactions
    if (data.transactions) {
        for (const t of data.transactions) {
            await transactionsStore.setItem(String(t.id), t);
        }
    }

    // Import yearly closings
    if (data.yearlyClosings) {
        for (const yc of data.yearlyClosings) {
            await yearlyClosingsStore.setItem(String(yc.year), yc);
        }
    }

    // Import meta
    if (data.meta) {
        for (const [key, val] of Object.entries(data.meta)) {
            await metaStore.setItem(key, val);
        }
    }
}
