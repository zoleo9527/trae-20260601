import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbOperations, onInit } from './database.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/orders', (_req, res) => {
  dbOperations.getAllOrders((err, orders) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(orders);
    }
  });
});

app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  dbOperations.getOrderById(id, (err, order) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!order) {
      res.status(404).json({ error: '订单不存在' });
    } else {
      res.json(order);
    }
  });
});

app.post('/api/orders', (req, res) => {
  const orderData = req.body;
  dbOperations.createOrder(orderData, (err, order) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json(order);
    }
  });
});

app.put('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  dbOperations.updateOrderStatus(id, status, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

app.put('/api/orders/:id/vehicle', (req, res) => {
  const { id } = req.params;
  const { vehicleId, driverName } = req.body;
  dbOperations.updateOrderVehicle(id, vehicleId, driverName, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

app.get('/api/orders/:id/addons', (req, res) => {
  const { id } = req.params;
  dbOperations.getAllAddonsByOrderId(id, (err, addons) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(addons);
    }
  });
});

app.post('/api/orders/:id/addons', (req, res) => {
  const { id } = req.params;
  const addonData = { ...req.body, orderId: id };
  dbOperations.createAddon(addonData, (err, addon) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json(addon);
    }
  });
});

app.get('/api/orders/:id/damages', (req, res) => {
  const { id } = req.params;
  dbOperations.getAllDamagesByOrderId(id, (err, damages) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(damages);
    }
  });
});

app.post('/api/orders/:id/damages', (req, res) => {
  const { id } = req.params;
  const damageData = { ...req.body, orderId: id };
  dbOperations.createDamage(damageData, (err, damage) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json(damage);
    }
  });
});

app.get('/api/orders/:id/expenses', (req, res) => {
  const { id } = req.params;
  dbOperations.getExpensesByOrderId(id, (err, expense) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(expense || {});
    }
  });
});

app.put('/api/orders/:id/expenses', (req, res) => {
  const { id } = req.params;
  const expenseData = { ...req.body, orderId: id };
  dbOperations.createOrUpdateExpenses(expenseData, (err, expense) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(expense);
    }
  });
});

app.put('/api/orders/:id/expenses/confirm', (req, res) => {
  const { id } = req.params;
  dbOperations.getExpensesByOrderId(id, (err, expense) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!expense) {
      res.status(404).json({ error: '费用记录不存在' });
    } else {
      dbOperations.createOrUpdateExpenses(
        { ...expense, orderId: id, status: 'confirmed', confirmedAt: new Date().toISOString() },
        (err, updated) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json(updated);
          }
        }
      );
    }
  });
});

app.put('/api/orders/:id/expenses/reject', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  dbOperations.getExpensesByOrderId(id, (err, expense) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (!expense) {
      res.status(404).json({ error: '费用记录不存在' });
    } else {
      dbOperations.createOrUpdateExpenses(
        { ...expense, orderId: id, status: 'rejected', rejectReason: reason },
        (err, updated) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json(updated);
          }
        }
      );
    }
  });
});

app.get('/api/orders/:id/logs', (req, res) => {
  const { id } = req.params;
  dbOperations.getAllLogsByOrderId(id, (err, logs) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(logs);
    }
  });
});

app.get('/api/logs', (_req, res) => {
  dbOperations.getAllLogs((err, logs) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(logs || []);
    }
  });
});

app.post('/api/orders/:id/logs', (req, res) => {
  const { id } = req.params;
  const logData = { ...req.body, orderId: id };
  dbOperations.createLog(logData, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

app.get('/api/exceptions', (_req, res) => {
  dbOperations.getAllExceptions((err, exceptions) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(exceptions);
    }
  });
});

app.post('/api/exceptions', (req, res) => {
  const exceptionData = req.body;
  dbOperations.createException(exceptionData, (err, exception) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json(exception);
    }
  });
});

app.put('/api/exceptions/:id/resolve', (req, res) => {
  const { id } = req.params;
  dbOperations.resolveException(id, (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ success: true });
    }
  });
});

app.use(express.static(path.join(__dirname, '../dist')));

onInit(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
