import { Router } from 'express';
import { getRevenueForecast, getNoShowForecast, getStockForecast, getPeakHourForecast } from '../controllers/forecastingController.js';

const router = Router();

router.get('/revenue',   getRevenueForecast);
router.get('/no-show',   getNoShowForecast);
router.get('/stock',     getStockForecast);
router.get('/peak-hours', getPeakHourForecast);

export default router;
