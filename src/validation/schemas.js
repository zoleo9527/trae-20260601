const { z } = require('zod');

const BookingStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  FEE_PENDING: 'FEE_PENDING',
  FEE_APPROVED: 'FEE_APPROVED',
  FEE_REJECTED: 'FEE_REJECTED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const createBookingSchema = z.object({
  venueId: z.number().int().positive(),
  customerName: z.string().min(1),
  customerPhone: z.string().optional(),
  bookingDate: z.coerce.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime: z.string().regex(/^\d{2}:\d{2}$/),
  hours: z.number().positive(),
  totalAmount: z.number().positive(),
  priority: z.number().int().min(0).default(0),
  note: z.string().optional(),
});

const updateBookingSchema = z.object({
  venueId: z.number().int().positive().optional(),
  customerName: z.string().min(1).optional(),
  customerPhone: z.string().optional(),
  bookingDate: z.coerce.date().optional(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  hours: z.number().positive().optional(),
  totalAmount: z.number().positive().optional(),
  priority: z.number().int().min(0).optional(),
});

const changeStatusSchema = z.object({
  status: z.nativeEnum(BookingStatus),
  details: z.string().optional(),
});

const addNoteSchema = z.object({
  content: z.string().min(1),
  stage: z.string().default('GENERAL'),
});

const feeApproveSchema = z.object({
  actualAmount: z.number().positive(),
  paymentMethod: z.string().min(1),
});

const feeRejectSchema = z.object({
  reason: z.string().min(1),
});

module.exports = {
  createBookingSchema,
  updateBookingSchema,
  changeStatusSchema,
  addNoteSchema,
  feeApproveSchema,
  feeRejectSchema,
};
