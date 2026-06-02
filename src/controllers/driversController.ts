import { Request, Response } from 'express';
import db from '../database';

export const getAllDrivers = (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM drivers ORDER BY name
    `).all();

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch drivers' });
  }
};

export const getDriverById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT * FROM drivers WHERE id = ?
    `).get(id);

    if (!row) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json(row);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch driver' });
  }
};

export const createDriver = (req: Request, res: Response) => {
  try {
    const { name, phone, employee_id, license_number, status, avatar_url } = req.body;

    const result = db.prepare(`
      INSERT INTO drivers (name, phone, employee_id, license_number, status, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(name, phone, employee_id, license_number, status || 'active', avatar_url);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Driver created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create driver' });
  }
};

export const updateDriver = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, phone, employee_id, license_number, status, avatar_url } = req.body;

    const result = db.prepare(`
      UPDATE drivers
      SET name = ?, phone = ?, employee_id = ?, license_number = ?, status = ?, avatar_url = ?
      WHERE id = ?
    `).run(name, phone, employee_id, license_number, status, avatar_url, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ message: 'Driver updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update driver' });
  }
};

export const deleteDriver = (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = db.prepare(`
      DELETE FROM drivers WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ message: 'Driver deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete driver' });
  }
};
