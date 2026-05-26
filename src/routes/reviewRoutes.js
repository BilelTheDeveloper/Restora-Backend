import { Router } from 'express';
import { getReviews, createReview, replyToReview, deleteReview, getReviewStats } from '../controllers/reviewController.js';

const router = Router();

router.get('/stats',        getReviewStats);
router.get('/',             getReviews);
router.post('/',            createReview);
router.patch('/:id/reply',  replyToReview);
router.delete('/:id',       deleteReview);

export default router;
