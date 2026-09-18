import { Router } from 'express';
import { getSegmentCalculation } from '../controllers/segmentController.js';

export const segmentRoutes = Router();
segmentRoutes.get('/segments/:portId', getSegmentCalculation);
