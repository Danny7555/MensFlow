import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as medicationController from '../controllers/medicationController';

const router = Router();

router.use(authenticate);

router.get('/', medicationController.listMedications);
router.post('/', medicationController.createMedication);
router.put('/:medId', medicationController.updateMedication);
router.delete('/:medId', medicationController.deleteMedication);

export default router;
