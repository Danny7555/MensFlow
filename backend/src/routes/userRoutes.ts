import { Router } from 'express';
import { authenticate, requireFullAccess } from '../middleware/authenticate';
import * as userController from '../controllers/userController';

const router = Router();

router.use(authenticate);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.put('/settings', userController.updateSettings);
router.put('/dashboard', requireFullAccess, userController.updateDashboard);
router.post('/xp', userController.addUserXp);

export default router;
