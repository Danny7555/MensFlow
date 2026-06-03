import { Router } from 'express';
import { authenticate, requireFullAccess } from '../middleware/authenticate';
import * as partnerController from '../controllers/partnerController';

const router = Router();

router.use(authenticate);
router.use(requireFullAccess);

router.get('/status', partnerController.getPartnerStatus);
router.post('/pair', partnerController.pairPartner);
router.post('/invite', partnerController.invitePartner);
router.post('/disconnect', partnerController.disconnectPartner);

router.get('/ping', partnerController.getLatestPing);
router.post('/ping', partnerController.sendPing);

router.get('/chat', partnerController.getPartnerMessages);
router.post('/chat', partnerController.sendPartnerMessage);
router.get('/chat/suggest-replies', partnerController.suggestReplies);

router.post('/action', partnerController.toggleAction);

router.post('/request-access', partnerController.requestDetailedAccess);

export default router;
