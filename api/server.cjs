"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cors_1 = require("cors");
const database_js_1 = require("./database.js");
const url_1 = require("url");
const path_1 = require("path");
const __dirname = (0, path_1.dirname)((0, url_1.fileURLToPath)(import.meta.url));
const app = (0, express_1.default)();
const PORT = 3001;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/uploads', express_1.default.static((0, path_1.join)(__dirname, '../uploads')));
app.get('/api/orders', (req, res) => {
    const { status, search } = req.query;
    let query = 'SELECT * FROM orders ORDER BY created_at DESC';
    let params = [];
    if (status && status !== 'all') {
        query = 'SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC';
        params = [status];
    }
    else if (search) {
        query = 'SELECT * FROM orders WHERE customer_name LIKE ? OR phone LIKE ? OR device_model LIKE ? ORDER BY created_at DESC';
        params = [`%${search}%`, `%${search}%`, `%${search}%`];
    }
    database_js_1.db.all(query, params, (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else {
            res.json(rows);
        }
    });
});
app.get('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    database_js_1.db.get('SELECT * FROM orders WHERE id = ?', [id], (err, order) => {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else if (!order) {
            res.status(404).json({ error: 'Order not found' });
        }
        else {
            database_js_1.db.all('SELECT * FROM notes WHERE order_id = ? ORDER BY created_at DESC', [id], (noteErr, notes) => {
                if (noteErr) {
                    res.status(500).json({ error: noteErr.message });
                }
                else {
                    database_js_1.db.get('SELECT * FROM inspections WHERE order_id = ?', [id], (inspectErr, inspection) => {
                        if (inspectErr) {
                            res.status(500).json({ error: inspectErr.message });
                        }
                        else {
                            database_js_1.db.get('SELECT * FROM warranties WHERE order_id = ?', [id], (warrantyErr, warranty) => {
                                if (warrantyErr) {
                                    res.status(500).json({ error: warrantyErr.message });
                                }
                                else {
                                    database_js_1.db.all('SELECT * FROM inspection_photos WHERE order_id = ?', [id], (photoErr, photos) => {
                                        if (photoErr) {
                                            res.status(500).json({ error: photoErr.message });
                                        }
                                        else {
                                            const orderData = order;
                                            res.json({
                                                ...orderData,
                                                notes,
                                                inspection,
                                                warranty,
                                                photos
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
});
app.post('/api/orders', (req, res) => {
    const { customer_name, phone, device_model, serial_number, issue_description, created_by } = req.body;
    const id = `ORD-${String(Date.now()).slice(-3)}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    database_js_1.db.run('INSERT INTO orders (id, customer_name, phone, device_model, serial_number, issue_description, status, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [id, customer_name, phone, device_model, serial_number, issue_description, 'pending', created_by, now, now], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else {
            database_js_1.db.get('SELECT * FROM orders WHERE id = ?', [id], (getErr, order) => {
                res.status(201).json(order);
            });
        }
    });
});
app.put('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    database_js_1.db.run('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', [status, now, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else {
            database_js_1.db.get('SELECT * FROM orders WHERE id = ?', [id], (getErr, order) => {
                res.json(order);
            });
        }
    });
});
app.delete('/api/orders/:id', (req, res) => {
    const { id } = req.params;
    database_js_1.db.run('DELETE FROM spare_part_usages WHERE order_id = ?', [id]);
    database_js_1.db.run('DELETE FROM inspection_photos WHERE order_id = ?', [id]);
    database_js_1.db.run('DELETE FROM notes WHERE order_id = ?', [id]);
    database_js_1.db.run('DELETE FROM warranties WHERE order_id = ?', [id]);
    database_js_1.db.run('DELETE FROM inspections WHERE order_id = ?', [id]);
    database_js_1.db.run('DELETE FROM orders WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else {
            res.json({ message: 'Order deleted' });
        }
    });
});
app.get('/api/orders/:id/inspection', (req, res) => {
    const { id } = req.params;
    database_js_1.db.get('SELECT * FROM inspections WHERE order_id = ?', [id], (err, inspection) => {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else {
            res.json(inspection);
        }
    });
});
app.post('/api/orders/:id/inspection', (req, res) => {
    const { id } = req.params;
    const { technician_id, technician_name, appearance_condition, screen_condition, battery_condition, accessories, description } = req.body;
    const inspectId = `INS-${String(Date.now()).slice(-3)}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    database_js_1.db.get('SELECT * FROM inspections WHERE order_id = ?', [id], (err, existing) => {
        if (existing) {
            database_js_1.db.run('UPDATE inspections SET technician_id = ?, technician_name = ?, appearance_condition = ?, screen_condition = ?, battery_condition = ?, accessories = ?, description = ?, status = ?, created_at = ? WHERE order_id = ?', [technician_id, technician_name, appearance_condition, screen_condition, battery_condition, accessories, description, 'approved', now, id], function (updateErr) {
                if (updateErr) {
                    res.status(500).json({ error: updateErr.message });
                }
                else {
                    database_js_1.db.run('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', ['warranty_pending', now, id]);
                    database_js_1.db.get('SELECT * FROM inspections WHERE order_id = ?', [id], (getErr, inspection) => {
                        res.json(inspection);
                    });
                }
            });
        }
        else {
            database_js_1.db.run('INSERT INTO inspections (id, order_id, technician_id, technician_name, appearance_condition, screen_condition, battery_condition, accessories, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [inspectId, id, technician_id, technician_name, appearance_condition, screen_condition, battery_condition, accessories, description, 'approved', now], function (insertErr) {
                if (insertErr) {
                    res.status(500).json({ error: insertErr.message });
                }
                else {
                    database_js_1.db.run('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', ['warranty_pending', now, id]);
                    database_js_1.db.get('SELECT * FROM inspections WHERE id = ?', [inspectId], (getErr, inspection) => {
                        res.status(201).json(inspection);
                    });
                }
            });
        }
    });
});
app.get('/api/orders/:id/warranty', (req, res) => {
    const { id } = req.params;
    database_js_1.db.get('SELECT * FROM warranties WHERE order_id = ?', [id], (err, warranty) => {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else {
            res.json(warranty);
        }
    });
});
app.post('/api/orders/:id/warranty', (req, res) => {
    const { id } = req.params;
    const { manager_id, manager_name, warranty_type, warranty_period, responsibility } = req.body;
    const warrantyId = `WAR-${String(Date.now()).slice(-3)}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    database_js_1.db.get('SELECT * FROM warranties WHERE order_id = ?', [id], (err, existing) => {
        if (existing) {
            database_js_1.db.run('UPDATE warranties SET manager_id = ?, manager_name = ?, warranty_type = ?, warranty_period = ?, responsibility = ?, approved = ?, approved_at = ? WHERE order_id = ?', [manager_id, manager_name, warranty_type, warranty_period, responsibility, 1, now, id], function (updateErr) {
                if (updateErr) {
                    res.status(500).json({ error: updateErr.message });
                }
                else {
                    database_js_1.db.run('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', ['repairing', now, id]);
                    database_js_1.db.get('SELECT * FROM warranties WHERE order_id = ?', [id], (getErr, warranty) => {
                        res.json(warranty);
                    });
                }
            });
        }
        else {
            database_js_1.db.run('INSERT INTO warranties (id, order_id, manager_id, manager_name, warranty_type, warranty_period, responsibility, approved, approved_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [warrantyId, id, manager_id, manager_name, warranty_type, warranty_period, responsibility, 1, now, now], function (insertErr) {
                if (insertErr) {
                    res.status(500).json({ error: insertErr.message });
                }
                else {
                    database_js_1.db.run('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?', ['repairing', now, id]);
                    database_js_1.db.get('SELECT * FROM warranties WHERE id = ?', [warrantyId], (getErr, warranty) => {
                        res.status(201).json(warranty);
                    });
                }
            });
        }
    });
});
app.post('/api/orders/:id/notes', (req, res) => {
    const { id } = req.params;
    const { user_id, user_name, content } = req.body;
    const noteId = `NT-${String(Date.now()).slice(-3)}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    database_js_1.db.run('INSERT INTO notes (id, order_id, user_id, user_name, content, created_at) VALUES (?, ?, ?, ?, ?, ?)', [noteId, id, user_id, user_name, content, now], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else {
            database_js_1.db.get('SELECT * FROM notes WHERE id = ?', [noteId], (getErr, note) => {
                res.status(201).json(note);
            });
        }
    });
});
app.get('/api/spare-parts', (req, res) => {
    database_js_1.db.all('SELECT * FROM spare_parts ORDER BY name', (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else {
            res.json(rows);
        }
    });
});
app.post('/api/spare-parts', (req, res) => {
    const { name, sku, quantity, location } = req.body;
    const id = `SP-${String(Date.now()).slice(-3)}`;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    database_js_1.db.run('INSERT INTO spare_parts (id, name, sku, quantity, location, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, name, sku, quantity || 0, location, now, now], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else {
            database_js_1.db.get('SELECT * FROM spare_parts WHERE id = ?', [id], (getErr, part) => {
                res.status(201).json(part);
            });
        }
    });
});
app.put('/api/spare-parts/:id', (req, res) => {
    const { id } = req.params;
    const { name, sku, quantity, location } = req.body;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    database_js_1.db.run('UPDATE spare_parts SET name = ?, sku = ?, quantity = ?, location = ?, updated_at = ? WHERE id = ?', [name, sku, quantity, location, now, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else {
            database_js_1.db.get('SELECT * FROM spare_parts WHERE id = ?', [id], (getErr, part) => {
                res.json(part);
            });
        }
    });
});
app.delete('/api/spare-parts/:id', (req, res) => {
    const { id } = req.params;
    database_js_1.db.run('DELETE FROM spare_part_usages WHERE spare_part_id = ?', [id]);
    database_js_1.db.run('DELETE FROM spare_parts WHERE id = ?', [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else {
            res.json({ message: 'Spare part deleted' });
        }
    });
});
app.post('/api/reset', (req, res) => {
    (0, database_js_1.insertSampleData)().then(() => {
        res.json({ message: 'Data reset completed' });
    }).catch(err => {
        res.status(500).json({ error: err.message });
    });
});
(0, database_js_1.initDatabase)();
setTimeout(() => {
    (0, database_js_1.insertSampleData)();
}, 500);
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
