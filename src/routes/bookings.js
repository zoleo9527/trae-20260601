const express = require('express');
const { BookingService } = require('../services/bookingService');
const validate = require('../middleware/validate');
const {
  createBookingSchema,
  updateBookingSchema,
  changeStatusSchema,
  addNoteSchema,
} = require('../validation/schemas');

const router = express.Router();

router.get('/', async (req, res) => {
  const bookings = await BookingService.list(req.query);
  res.json({ data: bookings });
});

router.get('/:id', async (req, res) => {
  const booking = await BookingService.getById(Number(req.params.id));
  if (!booking) {
    return res.status(404).json({ error: '申请不存在' });
  }
  res.json({ data: booking });
});

router.post('/', validate(createBookingSchema), async (req, res) => {
  const { note, ...bookingData } = req.validatedBody;

  const booking = await BookingService.create(bookingData, req.user.id);

  if (note) {
    await BookingService.addNote(booking.id, req.user.id, note, 'APPLICATION');
    const updated = await BookingService.getById(booking.id);
    return res.status(201).json({ data: updated });
  }

  res.status(201).json({ data: booking });
});

router.put('/:id', validate(updateBookingSchema), async (req, res) => {
  const booking = await BookingService.update(
    Number(req.params.id),
    req.validatedBody,
    req.user.id
  );
  res.json({ data: booking });
});

router.post('/:id/status', validate(changeStatusSchema), async (req, res) => {
  const { status, details } = req.validatedBody;
  const booking = await BookingService.changeStatus(
    Number(req.params.id),
    status,
    req.user.id,
    req.user.role,
    details
  );
  res.json({ data: booking });
});

router.post('/:id/submit', async (req, res) => {
  const booking = await BookingService.submitForReview(
    Number(req.params.id),
    req.user.id,
    req.user.role
  );
  res.json({ data: booking });
});

router.post('/:id/cancel', async (req, res) => {
  const { reason } = req.body;
  const booking = await BookingService.cancel(
    Number(req.params.id),
    req.user.id,
    req.user.role,
    reason
  );
  res.json({ data: booking });
});

router.post('/:id/notes', validate(addNoteSchema), async (req, res) => {
  const { content, stage } = req.validatedBody;
  const note = await BookingService.addNote(
    Number(req.params.id),
    req.user.id,
    content,
    stage
  );
  res.status(201).json({ data: note });
});

router.get('/:id/notes', async (req, res) => {
  const booking = await BookingService.getById(Number(req.params.id));
  if (!booking) {
    return res.status(404).json({ error: '申请不存在' });
  }
  res.json({ data: booking.notes });
});

module.exports = router;
