import { Request, Response } from 'express';
import db from '../database';

export const getAllVehicles = (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM vehicles ORDER BY plate_number
    `).all();

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

export const getVehicleById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT * FROM vehicles WHERE id = ?
    `).get(id);

    if (!row) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json(row);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vehicle' });
  }
};

export const createVehicle = (req: Request, res: Response) => {
  try {
    const { plate_number, model, capacity, status, last_maintenance_date } = req.body;

    const result = db.prepare(`
      INSERT INTO vehicles (plate_number, model, capacity, status, last_maintenance_date)
      VALUES (?, ?, ?, ?, ?)
    `).run(plate_number, model, capacity, status || 'active', last_maintenance_date);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Vehicle created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create vehicle' });
  }
};

export const updateVehicle = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { plate_number, model, capacity, status, last_maintenance_date } = req.body;

    const result = db.prepare(`
      UPDATE vehicles
      SET plate_number = ?, model = ?, capacity = ?, status = ?, last_maintenance_date = ?
      WHERE id = ?
    `).run(plate_number, model, capacity, status, last_maintenance_date, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update vehicle' });
  }
};

export const deleteVehicle = (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = db.prepare(`
      DELETE FROM vehicles WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete vehicle' });
  }
};
