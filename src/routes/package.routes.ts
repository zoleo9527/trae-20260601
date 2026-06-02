import { Router } from 'express';
import * as packageController from '../controllers/package.controller';

const router = Router();

router.post('/', packageController.createPackage);
router.get('/', packageController.listPackages);
router.get('/:packageId', packageController.getPackage);
router.post('/:packageId/review', packageController.reviewPackage);
router.post('/:packageId/ship', packageController.shipPackage);
router.put('/:packageId/items', packageController.updatePackageItems);

export default router;
