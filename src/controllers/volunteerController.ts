import { Request, Response } from 'express';
import { getDatabase } from '../lib/database';
import { Volunteer } from '../types';

export function getVolunteers(req: Request, res: Response) {
  const db = getDatabase();
  const { status } = req.query;

  let query = 'SELECT * FROM volunteers WHERE 1=1';
  const params: (string | number)[] = [];

  if (status) {
    query += ' AND status = ?';
    params.push(String(status));
  }

  query += ' ORDER BY registered_at DESC';

  const volunteers = db.prepare(query).all(params) as Volunteer[];
  res.json(volunteers);
}

export function getVolunteerById(req: Request, res: Response) {
  const { id } = req.params;
  const db = getDatabase();

  const volunteer = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(id) as Volunteer | undefined;

  if (!volunteer) {
    return res.status(404).json({ error: '志愿者不存在' });
  }

  res.json(volunteer);
}

export function createVolunteer(req: Request, res: Response) {
  const { name, phone, id_card } = req.body;

  if (!name || !phone || !id_card) {
    return res.status(400).json({ error: '必填字段不能为空' });
  }

  const db = getDatabase();

  try {
    const result = db.prepare(
      'INSERT INTO volunteers (name, phone, id_card) VALUES (?, ?, ?)'
    ).run(name, phone, id_card);

    const volunteer = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(result.lastInsertRowid) as Volunteer;
    res.status(201).json(volunteer);
  } catch (error) {
    res.status(400).json({ error: '身份证号已存在' });
  }
}

export function updateVolunteer(req: Request, res: Response) {
  const { id } = req.params;
  const { name, phone, status } = req.body;

  const db = getDatabase();
  const volunteer = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(id) as Volunteer | undefined;

  if (!volunteer) {
    return res.status(404).json({ error: '志愿者不存在' });
  }

  const updates: string[] = [];
  const params: (string | number)[] = [];

  if (name) {
    updates.push('name = ?');
    params.push(name);
  }
  if (phone) {
    updates.push('phone = ?');
    params.push(phone);
  }
  if (status) {
    updates.push('status = ?');
    params.push(status);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: '没有需要更新的字段' });
  }

  params.push(id);
  db.prepare(`UPDATE volunteers SET ${updates.join(', ')} WHERE id = ?`).run(params);

  const updated = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(id) as Volunteer;
  res.json(updated);
}

export function deleteVolunteer(req: Request, res: Response) {
  const { id } = req.params;
  const db = getDatabase();

  const volunteer = db.prepare('SELECT * FROM volunteers WHERE id = ?').get(id) as Volunteer | undefined;

  if (!volunteer) {
    return res.status(404).json({ error: '志愿者不存在' });
  }

  db.prepare('DELETE FROM volunteers WHERE id = ?').run(id);
  res.json({ message: '删除成功' });
}
