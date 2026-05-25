import { Router } from 'express';
import {
  getDashboardStats, getRevenueChart, getTopItems,
  getTableOccupancy, getHourlyHeatmap, getMenuEngineering,
  getOrderTypeBreakdown,
} from '../controllers/analyticsController.js';

const router = Router();

router.get('/dashboard',     getDashboardStats);
router.get('/revenue',       getRevenueChart);
router.get('/top-items',     getTopItems);
router.get('/table-occupancy', getTableOccupancy);
router.get('/heatmap',       getHourlyHeatmap);
router.get('/menu-engineering', getMenuEngineering);
router.get('/order-types',   getOrderTypeBreakdown);

export default router;
