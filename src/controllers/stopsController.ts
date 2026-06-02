import { Request, Response } from 'express';
import db from '../database';
import { getRouteSummary, checkStopReferences } from '../utils';

export const getAllStops = (req: Request, res: Response) => {
  try {
    const { route_id } = req.query;

    let query = 'SELECT * FROM stops WHERE 1=1';
    const params: any[] = [];

    if (route_id) {
      query += ' AND route_id = ?';
      params.push(route_id);
    }

    query += ' ORDER BY route_id, sequence';

    const rows = db.prepare(query).all(...params) as any[];

    const stops = rows.map(row => ({
      ...row,
      route: getRouteSummary(row.route_id)
    }));

    res.json(stops);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stops' });
  }
};

export const getStopById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT * FROM stops WHERE id = ?
    `).get(id) as any;

    if (!row) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    const stop = {
      ...row,
      route: getRouteSummary(row.route_id)
    };

    res.json(stop);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch stop' });
  }
};

export const createStop = (req: Request, res: Response) => {
  try {
    const { route_id, name, address, sequence, estimated_arrival_time, latitude, longitude } = req.body;

    const route = db.prepare(`
      SELECT id FROM routes WHERE id = ?
    `).get(route_id);

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const result = db.prepare(`
      INSERT INTO stops (route_id, name, address, sequence, estimated_arrival_time, latitude, longitude)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(route_id, name, address, sequence, estimated_arrival_time, latitude, longitude);

    const stopId = result.lastInsertRowid as number;

    const stop = db.prepare(`
      SELECT * FROM stops WHERE id = ?
    `).get(stopId) as any;

    const response = {
      id: stopId,
      message: 'Stop created successfully',
      data: {
        ...stop,
        route: getRouteSummary(stop.route_id)
      }
    };

    res.status(201).json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create stop' });
  }
};

export const updateStop = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, address, sequence, estimated_arrival_time, latitude, longitude } = req.body;

    const existingStop = db.prepare(`
      SELECT * FROM stops WHERE id = ?
    `).get(id);

    if (!existingStop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    const result = db.prepare(`
      UPDATE stops
      SET name = ?, address = ?, sequence = ?, estimated_arrival_time = ?, latitude = ?, longitude = ?
      WHERE id = ?
    `).run(name, address, sequence, estimated_arrival_time, latitude, longitude, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    const stop = db.prepare(`
      SELECT * FROM stops WHERE id = ?
    `).get(id) as any;

    const response = {
      message: 'Stop updated successfully',
      data: {
        ...stop,
        route: getRouteSummary(stop.route_id)
      }
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update stop' });
  }
};

export const deleteStop = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const stopId = Number(id);

    const existingStop = db.prepare(`
      SELECT * FROM stops WHERE id = ?
    `).get(stopId);

    if (!existingStop) {
      return res.status(404).json({ error: 'Stop not found' });
    }

    const refCheck = checkStopReferences(stopId);
    if (!refCheck.can_delete) {
      return res.status(409).json({
        error: refCheck.message,
        code: 'STOP_HAS_REFERENCES',
        references: refCheck.references
      });
    }

    db.prepare(`
      DELETE FROM stops WHERE id = ?
    `).run(stopId);

    res.json({ message: 'Stop deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete stop' });
  }
};

export const bulkUpdateStops = (req: Request, res: Response) => {
  try {
    const { route_id, stops } = req.body;

    if (!route_id || !stops || !Array.isArray(stops)) {
      return res.status(400).json({ error: 'route_id and stops array are required' });
    }

    const route = db.prepare(`
      SELECT id FROM routes WHERE id = ?
    `).get(route_id);

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const deletedStopErrors: any[] = [];
    for (const stop of stops) {
      if (stop.id && stop._deleted) {
        const refCheck = checkStopReferences(stop.id);
        if (!refCheck.can_delete) {
          deletedStopErrors.push({
            stop_id: stop.id,
            error: refCheck.message,
            references: refCheck.references
          });
        }
      }
    }

    if (deletedStopErrors.length > 0) {
      return res.status(409).json({
        error: '部分站点无法删除，因为仍被其他数据引用',
        code: 'STOP_HAS_REFERENCES',
        failed_stops: deletedStopErrors
      });
    }

    const transaction = db.transaction(() => {
      for (const stop of stops) {
        if (stop.id) {
          if (stop._deleted) {
            db.prepare(`
              DELETE FROM stops WHERE id = ? AND route_id = ?
            `).run(stop.id, route_id);
          } else {
            db.prepare(`
              UPDATE stops
              SET name = ?, address = ?, sequence = ?, estimated_arrival_time = ?, latitude = ?, longitude = ?
              WHERE id = ? AND route_id = ?
            `).run(
              stop.name,
              stop.address,
              stop.sequence,
              stop.estimated_arrival_time,
              stop.latitude,
              stop.longitude,
              stop.id,
              route_id
            );
          }
        } else {
          db.prepare(`
            INSERT INTO stops (route_id, name, address, sequence, estimated_arrival_time, latitude, longitude)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            route_id,
            stop.name,
            stop.address,
            stop.sequence,
            stop.estimated_arrival_time,
            stop.latitude,
            stop.longitude
          );
        }
      }
    });

    transaction();

    const updatedStops = db.prepare(`
      SELECT * FROM stops WHERE route_id = ? ORDER BY sequence
    `).all(route_id) as any[];

    const response = {
      message: 'Stops updated successfully',
      data: updatedStops.map(stop => ({
        ...stop,
        route: getRouteSummary(stop.route_id)
      }))
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Failed to bulk update stops' });
  }
};
