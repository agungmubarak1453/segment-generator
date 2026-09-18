import { getCanvasModel } from '../models/canvasModel.js';

export function getCanvas(_request, response) {
  try {
    const canvas = getCanvasModel();
    response.json(canvas);
  } catch (error) {
    response.status(500).json({
      error: 'Unable to retrieve the canvas.',
      details: error.message,
    });
  }
}
