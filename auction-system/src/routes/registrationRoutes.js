const express = require('express');
const router = express.Router();
const { createRegistration, getUserRegistrations, payDeposit, confirmRegistration, rejectRegistration, withdrawRegistration, getRegistrationById, getAllRegistrations, getRegistrationStatusHistory, confirmTransaction } = require('../controllers/registrationController');
const { authenticate, requireBidder, requireFinance, requireAdmin } = require('../middleware/auth');

router.post('/', authenticate, requireBidder, createRegistration);
router.get('/my-registrations', authenticate, requireBidder, getUserRegistrations);
router.put('/:registrationId/pay-deposit', authenticate, payDeposit);
router.put('/:registrationId/confirm', authenticate, requireAdmin, confirmRegistration);
router.put('/:registrationId/reject', authenticate, requireAdmin, rejectRegistration);
router.put('/:registrationId/withdraw', authenticate, withdrawRegistration);
router.get('/:id', authenticate, getRegistrationById);
router.get('/', authenticate, requireAdmin, getAllRegistrations);
router.get('/:id/history', authenticate, getRegistrationStatusHistory);
router.put('/:registrationId/confirm-transaction', authenticate, requireFinance, confirmTransaction);

module.exports = router;