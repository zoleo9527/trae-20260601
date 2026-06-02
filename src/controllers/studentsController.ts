import { Request, Response } from 'express';
import db from '../database';
import { getRouteSummary, getStopSummary } from '../utils';

export const getAllStudents = (req: Request, res: Response) => {
  try {
    const rows = db.prepare(`
      SELECT * FROM students ORDER BY name
    `).all() as any[];

    const students = rows.map(row => ({
      ...row,
      default_route: row.default_route_id ? getRouteSummary(row.default_route_id) : undefined,
      default_stop: row.default_stop_id ? getStopSummary(row.default_stop_id) : undefined
    }));

    res.json(students);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students' });
  }
};

export const getStudentById = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = db.prepare(`
      SELECT * FROM students WHERE id = ?
    `).get(id) as any;

    if (!row) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const student = {
      ...row,
      default_route: row.default_route_id ? getRouteSummary(row.default_route_id) : undefined,
      default_stop: row.default_stop_id ? getStopSummary(row.default_stop_id) : undefined
    };

    res.json(student);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch student' });
  }
};

export const createStudent = (req: Request, res: Response) => {
  try {
    const {
      name,
      student_id,
      grade,
      class: studentClass,
      parent_name,
      parent_phone,
      default_route_id,
      default_stop_id,
      avatar_url
    } = req.body;

    const result = db.prepare(`
      INSERT INTO students (name, student_id, grade, class, parent_name, parent_phone, default_route_id, default_stop_id, avatar_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, student_id, grade, studentClass, parent_name, parent_phone, default_route_id, default_stop_id, avatar_url);

    res.status(201).json({ id: result.lastInsertRowid, message: 'Student created successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create student' });
  }
};

export const updateStudent = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      name,
      student_id,
      grade,
      class: studentClass,
      parent_name,
      parent_phone,
      default_route_id,
      default_stop_id,
      avatar_url
    } = req.body;

    const result = db.prepare(`
      UPDATE students
      SET name = ?, student_id = ?, grade = ?, class = ?, parent_name = ?, parent_phone = ?, 
          default_route_id = ?, default_stop_id = ?, avatar_url = ?
      WHERE id = ?
    `).run(name, student_id, grade, studentClass, parent_name, parent_phone, default_route_id, default_stop_id, avatar_url, id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update student' });
  }
};

export const deleteStudent = (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = db.prepare(`
      DELETE FROM students WHERE id = ?
    `).run(id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student' });
  }
};
