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
router.get('/login-history', userController.getLoginHistory);
router.post('/deactivate', userController.deactivateAccount);
router.delete('/delete', userController.deleteAccount);

export default router;
