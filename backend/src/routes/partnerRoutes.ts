import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as partnerController from '../controllers/partnerController';

const router = Router();

router.use(authenticate);

router.get('/status', partnerController.getPartnerStatus);
router.post('/pair', partnerController.pairPartner);
router.post('/invite', partnerController.invitePartner);
router.post('/disconnect', partnerController.disconnectPartner);

router.get('/ping', partnerController.getLatestPing);
router.post('/ping', partnerController.sendPing);

router.post('/action', partnerController.toggleAction);

export default router;
