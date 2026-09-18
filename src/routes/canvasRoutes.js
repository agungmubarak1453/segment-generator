import { Router } from 'express';
import { getCanvas } from '../controllers/canvasController.js';

export const canvasRoutes = Router();
canvasRoutes.get('/canvas', getCanvas);
