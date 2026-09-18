import { app } from './app.js';
import { config } from './config.js';

app.listen(config.port, config.host, () => {
  console.log(`Segment Generator API listening on http://${config.host}:${config.port}`);
  console.log(`Swagger UI available at http://localhost:${config.port}/api-docs`);
});
