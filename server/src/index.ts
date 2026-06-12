import express from 'express';
import cors from 'cors';
import projectRoutes from './routes/projectRoutes.ts';
import documentRoutes from './routes/documentRoutes.ts';
import statusHistoryRoutes from './routes/statusHistoryRoutes.ts';
import { projectService } from './services/projectService.ts';
import { documentService } from './services/documentService.ts';
import db from './database.ts';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/status-history', statusHistoryRoutes);

app.get('/api/stats', (req, res) => {
  try {
    const projectStats = projectService.getStats();
    const documentStats = documentService.getStats();

    const pendingProjects = db.prepare(`
      SELECT id, name, status FROM projects 
      WHERE status IN ('draft', 'initial_review', 're_review', 'rejected')
      ORDER BY updated_at DESC
      LIMIT 5
    `).all() as Array<{ id: string; name: string; status: string }>;

    const pendingDocuments = db.prepare(`
      SELECT d.id, p.name, d.status 
      FROM documents d
      LEFT JOIN projects p ON d.project_id = p.id
      WHERE d.status IN ('pending', 'drafting', 'review', 'rejected')
      ORDER BY d.updated_at DESC
      LIMIT 5
    `).all() as Array<{ id: string; name: string | null; status: string }>;

    const pendingTasks = [
      ...pendingProjects.map(p => ({
        id: p.id,
        type: 'project' as const,
        title: p.name,
        status: p.status,
      })),
      ...pendingDocuments.map(d => ({
        id: d.id,
        type: 'document' as const,
        title: d.name || `文档 ${d.id.slice(0, 8)}`,
        status: d.status,
      })),
    ].slice(0, 10);

    res.json({
      success: true,
      data: {
        projectStats,
        documentStats,
        pendingTasks,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: error.message } });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
