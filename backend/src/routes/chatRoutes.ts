import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as chatController from '../controllers/chatController';

const router = Router();

router.post('/guest-message', chatController.sendGuestMessage);
router.get('/suggestions', chatController.getSuggestions);

router.use(authenticate);

router.get('/daily-guidance', chatController.getDailyGuidance);
router.get('/ai-usage', chatController.getAIUsageStats);
router.get('/sessions', chatController.getSessions);
router.get('/sessions/:sessionId', chatController.getMessages);
router.post('/message', chatController.sendMessage);
router.put('/sessions/:sessionId/lock', chatController.lockSession);
router.post('/sessions/:sessionId/unlock', chatController.unlockSession);
router.put('/sessions/:sessionId/unlock-permanent', chatController.unlockSessionPermanent);
router.delete('/sessions/:sessionId', chatController.deleteSession);

export default router;
