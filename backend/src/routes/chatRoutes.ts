import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as chatController from '../controllers/chatController';

const router = Router();

router.use(authenticate);

router.get('/sessions', chatController.getSessions);
router.get('/sessions/:sessionId', chatController.getMessages);
router.post('/message', chatController.sendMessage);
router.put('/sessions/:sessionId/lock', chatController.lockSession);
router.post('/sessions/:sessionId/unlock', chatController.unlockSession);

export default router;
