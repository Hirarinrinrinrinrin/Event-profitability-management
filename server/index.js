import express from 'express';
import cors from 'cors';
import { initializeDatabase } from './database.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Database
const dbPromise = initializeDatabase();

// Routes
app.get('/', (req, res) => {
    res.send('Food Truck Profit Management API');
});

/* --- Products API --- */
app.get('/api/products', async (req, res) => {
    try {
        const db = await dbPromise;
        const products = await db.all('SELECT * FROM products ORDER BY id DESC');
        res.json(products);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/products', async (req, res) => {
    try {
        const db = await dbPromise;
        const { name, cost_price } = req.body;
        const result = await db.run(
            'INSERT INTO products (name, cost_price) VALUES (?, ?)',
            [name, cost_price]
        );
        res.json({ id: result.lastID, name, cost_price });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const db = await dbPromise;
        const { name, cost_price } = req.body;
        await db.run(
            'UPDATE products SET name = ?, cost_price = ? WHERE id = ?',
            [name, cost_price, req.params.id]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/:id', async (req, res) => {
    try {
        const db = await dbPromise;
        await db.run('DELETE FROM products WHERE id = ?', req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

/* --- Openings API --- */
app.get('/api/openings/stats', async (req, res) => {
    try {
        const db = await dbPromise;
        const stats = await db.all(`
      SELECT 
        o.id, o.date, o.location, o.status,
        COALESCE(SUM(CASE WHEN t.type = 'sales' THEN t.amount * t.quantity ELSE 0 END), 0) as sales,
        COALESCE(SUM(CASE WHEN t.type = 'sales' THEN t.cost * t.quantity ELSE 0 END), 0) as cogs,
        COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) as expenses
      FROM openings o
      LEFT JOIN transactions t ON o.id = t.opening_id
      GROUP BY o.id
      ORDER BY o.date DESC
    `);
        res.json(stats);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/openings', async (req, res) => {
    try {
        const db = await dbPromise;
        const openings = await db.all('SELECT * FROM openings ORDER BY date DESC');
        res.json(openings);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/openings', async (req, res) => {
    try {
        const db = await dbPromise;
        const { date, location, start_time, end_time } = req.body;
        const result = await db.run(
            'INSERT INTO openings (date, location, start_time, end_time, status) VALUES (?, ?, ?, ?, ?)',
            [date, location, start_time, end_time, 'open']
        );
        res.json({ id: result.lastID });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/openings/:id', async (req, res) => {
    try {
        const db = await dbPromise;
        const { date, location, start_time, end_time } = req.body;
        await db.run(
            'UPDATE openings SET date = ?, location = ?, start_time = ?, end_time = ? WHERE id = ?',
            [date, location, start_time, end_time, req.params.id]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/openings/:id', async (req, res) => {
    try {
        const db = await dbPromise;
        // Ideally delete transactions first
        await db.run('DELETE FROM transactions WHERE opening_id = ?', req.params.id);
        await db.run('DELETE FROM openings WHERE id = ?', req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/openings/:id/close', async (req, res) => {
    try {
        const db = await dbPromise;
        await db.run('UPDATE openings SET status = ? WHERE id = ?', ['closed', req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

/* --- Yearly Closing API --- */
app.get('/api/years', async (req, res) => {
    try {
        const db = await dbPromise;
        // Get all distinct years from openings
        const yearsResult = await db.all(`
            SELECT DISTINCT strftime('%Y', date) as year 
            FROM openings 
            ORDER BY year DESC
        `);

        const years = [];
        for (const row of yearsResult) {
            if (!row.year) continue;
            const closing = await db.get('SELECT * FROM yearly_closings WHERE year = ?', row.year);
            years.push({
                year: parseInt(row.year),
                status: closing ? closing.status : 'open'
            });
        }
        res.json(years);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/years/:year/close', async (req, res) => {
    try {
        const db = await dbPromise;
        const year = req.params.year;
        await db.run(
            'INSERT OR REPLACE INTO yearly_closings (year, status, closed_at) VALUES (?, ?, ?)',
            [year, 'closed', new Date().toISOString()]
        );
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/products/all/reset', async (req, res) => {
    try {
        const db = await dbPromise;
        await db.run('DELETE FROM products');
        await db.run('DELETE FROM sqlite_sequence WHERE name="products"');
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/years/:year/data', async (req, res) => {
    try {
        const db = await dbPromise;
        const year = req.params.year;

        // 1. Get openings for the year
        const openings = await db.all(
            "SELECT id FROM openings WHERE strftime('%Y', date) = ?",
            year
        );

        if (openings.length > 0) {
            const openingIds = openings.map(o => o.id);
            const placeholders = openingIds.map(() => '?').join(',');

            // 2. Delete transactions for those openings
            await db.run(
                `DELETE FROM transactions WHERE opening_id IN (${placeholders})`,
                openingIds
            );

            // 3. Delete openings
            await db.run(
                `DELETE FROM openings WHERE id IN (${placeholders})`,
                openingIds
            );
        }

        // 4. Delete yearly closing status
        await db.run('DELETE FROM yearly_closings WHERE year = ?', year);

        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

/* --- Transactions API --- */
app.get('/api/transactions/:opening_id', async (req, res) => {
    try {
        const db = await dbPromise;
        const transactions = await db.all(
            'SELECT * FROM transactions WHERE opening_id = ? ORDER BY id DESC',
            req.params.opening_id
        );
        res.json(transactions);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/transactions', async (req, res) => {
    try {
        const db = await dbPromise;
        const { opening_id, type, item_name, amount, quantity, cost } = req.body;
        const result = await db.run(
            'INSERT INTO transactions (opening_id, type, item_name, amount, quantity, cost) VALUES (?, ?, ?, ?, ?, ?)',
            [opening_id, type, item_name, amount, quantity || 1, cost || 0]
        );
        res.json({ id: result.lastID });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/transactions/:id', async (req, res) => {
    try {
        const db = await dbPromise;
        await db.run('DELETE FROM transactions WHERE id = ?', req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
