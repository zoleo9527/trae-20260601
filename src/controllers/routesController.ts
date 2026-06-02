import { Request, Response } from 'express';
import db from '../database';
import { Route } from '../types';
import { getStopSummary } from '../utils';

export const getAllRoutes = (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM routes ORDER BY name
    `).all() as any[];

    const routes = rows.map(row => ({
      ...row,
      stops: getStopsByRouteId(row.id)
    }));

    res.json(routes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
};

export const getRouteById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT * FROM routes WHERE id = ?
    `).get(id) as any;

    if (!row) {
      return res.status(404).json({ error: 'Route not found' });
    }

    const route: Route = {
      ...row,
      stops: getStopsByRouteId(row.id)
    };

    res.json(route);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch route' });
  }
};

export const createRoute = (req: Request, res: Response) => {
  try {
    const { name, description, direction, estimated_duration, stops } = req.body;

    const result = db.prepare(`
      INSERT INTO routes (name, description, direction, estimated_duration)
      VALUES (?, ?, ?, ?)
    `).run(name, description, direction, estimated_duration);

    const routeId = result.lastInsertRowid as number;

    if (stops && stops.length > 0) {
      const insertStop = db.prepare(`
        INSERT INTO stops (route_id, name, address, sequence, estimated_arrival_time, latitude, longitude)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction((stops: any[]) => {
        for (const stop of stops) {
          insertStop.run(
            routeId,
            stop.name,
            stop.address,
            stop.sequence,
            stop.estimated_arrival_time,
            stop.latitude,
            stop.longitude
          );
        }
      });

      transaction(stops);
    }

    res.status(201).json({ id: routeId, message: 'Route created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create route' });
  }
};

export const updateRoute = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, direction, estimated_duration } = req.body;

    const result = db.prepare(`
      UPDATE routes
      SET name = ?, description = ?, direction = ?, estimated_duration = ?
      WHERE id = ?
    `).run(name, description, direction, estimated_duration, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json({ message: 'Route updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update route' });
  }
};

export const deleteRoute = (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = db.prepare(`
      DELETE FROM routes WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Route not found' });
    }

    res.json({ message: 'Route deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete route' });
  }
};

function getStopsByRouteId(routeId: number) {
  const rows = db.prepare(`
    SELECT * FROM stops WHERE route_id = ? ORDER BY sequence
  `).all(routeId) as any[];

  return rows.map(row => ({
    ...row
  }));
}
