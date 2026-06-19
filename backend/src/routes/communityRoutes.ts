import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import * as communityController from '../controllers/communityController';

const router = Router();

router.use(authenticate);

router.get('/', communityController.listPosts);
router.post('/', communityController.createPost);
router.get('/:postId', communityController.getPost);
router.post('/:postId/comments', communityController.addComment);
router.delete('/:postId', communityController.deletePost);

export default router;
