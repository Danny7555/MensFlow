import { Router } from 'express';
import { authenticate, requireFullAccess } from '../middleware/authenticate';
import * as cycleController from '../controllers/cycleController';

const router = Router();

router.use(authenticate);
router.use(requireFullAccess);

router.get('/', cycleController.getLogs);
router.post('/', cycleController.addLog);
router.delete('/', cycleController.clearLogs);

router.get('/custom', cycleController.getCustomSymptoms);
router.post('/custom', cycleController.addCustomSymptom);
router.delete('/custom/:id', cycleController.removeCustomSymptom);

export default router;
