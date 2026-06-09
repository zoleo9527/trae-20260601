import express from 'express';
import cors from 'cors';
import { users, tickets } from './data';
import type { Ticket, TicketHistory, TicketStatus } from './types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/users', (_req, res) => {
  res.json(users);
});

app.get('/api/tickets', (req, res) => {
  const { role, type, status } = req.query;
  let result = [...tickets];
  
  if (type) {
    result = result.filter(t => t.type === type);
  }
  if (status) {
    result = result.filter(t => t.status === status);
  }
  
  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  res.json(result);
});

app.get('/api/tickets/:id', (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  res.json(ticket);
});

app.post('/api/tickets', (req, res) => {
  const newTicket: Ticket = {
    id: `ticket-${Date.now()}`,
    ...req.body,
    status: 'pending' as TicketStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    history: [{
      id: `h-${Date.now()}-1`,
      ticketId: `ticket-${Date.now()}`,
      status: 'pending' as TicketStatus,
      operatorId: req.body.creatorId,
      operatorName: req.body.creatorName,
      operatorRole: req.body.creatorRole,
      remark: req.body.reason,
      createdAt: new Date().toISOString()
    }]
  };
  tickets.unshift(newTicket);
  res.status(201).json(newTicket);
});

app.put('/api/tickets/:id/status', (req, res) => {
  const ticketIndex = tickets.findIndex(t => t.id === req.params.id);
  if (ticketIndex === -1) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  
  const ticket = tickets[ticketIndex];
  const { status, operatorId, operatorName, operatorRole, remark } = req.body;
  
  const historyEntry: TicketHistory = {
    id: `h-${ticket.id}-${ticket.history.length + 1}`,
    ticketId: ticket.id,
    status,
    operatorId,
    operatorName,
    operatorRole,
    remark,
    createdAt: new Date().toISOString()
  };
  
  const updatedTicket: Ticket = {
    ...ticket,
    status,
    updatedAt: new Date().toISOString(),
    currentHandlerId: operatorId,
    currentHandlerName: operatorName,
    history: [...ticket.history, historyEntry]
  };
  
  tickets[ticketIndex] = updatedTicket;
  res.json(updatedTicket);
});

app.get('/api/tickets/:id/history', (req, res) => {
  const ticket = tickets.find(t => t.id === req.params.id);
  if (!ticket) {
    return res.status(404).json({ error: 'Ticket not found' });
  }
  res.json(ticket.history);
});

app.get('/api/stats', (_req, res) => {
  const stats = {
    pending: tickets.filter(t => t.status === 'pending').length,
    reviewing: tickets.filter(t => t.status === 'reviewing').length,
    approved: tickets.filter(t => t.status === 'approved').length,
    rejected: tickets.filter(t => t.status === 'rejected').length,
    completed: tickets.filter(t => t.status === 'completed').length,
    total: tickets.length
  };
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
