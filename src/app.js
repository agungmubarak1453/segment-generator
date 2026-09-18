import express from 'express';
import swaggerUi from 'swagger-ui-express';

import { openapiDocument } from './openapi.js';

import { canvasRoutes } from './routes/canvasRoutes.js';
import { segmentRoutes } from './routes/segmentRoutes.js';

export const app = express();

app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));

app.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use(canvasRoutes);
app.use(segmentRoutes);

app.use((_request, response) => {
  response.status(404).json({ error: 'Not Found' });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ error: 'Internal Server Error' });
});
