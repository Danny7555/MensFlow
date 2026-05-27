import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as userController from '../controllers/userController';

const router = Router();

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/settings', userController.updateSettings);
router.put('/dashboard', userController.updateDashboard);

export default router;
