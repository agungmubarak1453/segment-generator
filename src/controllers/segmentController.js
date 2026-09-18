import { calculateSegmentForPort } from '../models/segmentModel.js';

export function getSegmentCalculation(request, response) {
  const { portId } = request.params;

  try {
    const payload = calculateSegmentForPort(portId);
    response.json(payload);
  } catch (error) {
    if (error.message.startsWith('Port not found')) {
      response.status(404).json({
        error: 'Port not found.',
        details: error.message,
      });
      return;
    }

    response.status(500).json({
      error: 'Unable to calculate segment data.',
      details: error.message,
    });
  }
}
