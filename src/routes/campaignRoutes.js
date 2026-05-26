import { Router } from 'express';
import { getCampaigns, createCampaign, updateCampaign, deleteCampaign, sendCampaign, getCampaignStats } from '../controllers/campaignController.js';

const router = Router();

router.get('/stats',       getCampaignStats);
router.get('/',            getCampaigns);
router.post('/',           createCampaign);
router.patch('/:id',       updateCampaign);
router.delete('/:id',      deleteCampaign);
router.post('/:id/send',   sendCampaign);

export default router;
