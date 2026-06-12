const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registrationController');
const { authenticate, requireBidder, requireFinance, requireAdmin } = require('../middleware/auth');

router.post('/', authenticate, requireBidder, registrationController.createRegistration);
router.get('/my-registrations', authenticate, requireBidder, registrationController.getUserRegistrations);
router.put('/:registrationId/pay-deposit', authenticate, registrationController.payDeposit);
router.put('/:registrationId/confirm', authenticate, requireAdmin, registrationController.confirmRegistration);
router.put('/:registrationId/reject', authenticate, requireAdmin, registrationController.rejectRegistration);
router.put('/:registrationId/withdraw', authenticate, registrationController.withdrawRegistration);
router.get('/:id', authenticate, registrationController.getRegistrationById);
router.get('/', authenticate, requireAdmin, registrationController.getAllRegistrations);
router.get('/:id/history', authenticate, registrationController.getRegistrationStatusHistory);
router.put('/:registrationId/confirm-transaction', authenticate, requireFinance, registrationController.confirmTransaction);

module.exports = router;