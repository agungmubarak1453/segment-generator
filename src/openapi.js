export const openapiDocument = {
  openapi: '3.2.0',
  info: {
    title: 'Segment Generator API',
    version: '1.0.0',
    description: 'Service for getting canvas and calculating segments from directed port relationships.',
  },
  servers: [{ url: '/' }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          200: {
            description: 'The service is ready.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/HealthResponse' },
              },
            },
          },
        },
      },
    },
    '/canvas': {
      get: {
        summary: 'Get the canvas',
        responses: {
          200: {
            description: 'The complete canvas including nodes, ports, values and connections.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/CanvasResponse' },
              },
            },
          },
          500: {
            description: 'Unable to read the canvas.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
    '/segments/{portId}': {
      get: {
        summary: 'Get segment data for a target port',
        parameters: [
          {
            name: 'portId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Segment summary for the target port.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SegmentResponse' },
              },
            },
          },
          404: {
            description: 'The nominated port does not exist.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
          500: {
            description: 'Unable to calculate segment data.',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      HealthResponse: {
        type: 'object',
        required: ['status'],
        properties: {
          status: { type: 'string', example: 'ok' },
        },
      },
      ErrorResponse: {
        type: 'object',
        required: ['error'],
        properties: {
          error: { type: 'string' },
          details: { type: 'string' },
        },
      },
      CanvasResponse: {
        type: 'object',
        required: ['nodes', 'connections'],
        example: {
          nodes: [
            { id: '1', ports: [{ id: '1a', name: '1a', value: 100 }] },
            {
              id: '2',
              ports: [
                { id: '2a', name: '2a', value: 90 },
                { id: '2b', name: '2b', value: 130 },
              ],
            },
            { id: '3', ports: [{ id: '3a', name: '3a', value: 150 }] },
            { id: '4', ports: [{ id: '4a', name: '4a', value: 70 }] },
            { id: '5', ports: [{ id: '5a', name: '5a', value: 160 }] },
            {
              id: '6',
              ports: [
                { id: '6a', name: '6a', value: null },
                { id: '6b', name: '6b', value: null },
                { id: '6c', name: '6c', value: null },
              ],
            },
            {
              id: '7',
              ports: [
                { id: '7a', name: '7a', value: null },
                { id: '7b', name: '7b', value: null },
                { id: '7c', name: '7c', value: null },
              ],
            },
            { id: '8', ports: [{ id: '8a', name: '8a', value: 200 }] },
            { id: '9', ports: [{ id: '9a', name: '9a', value: 120 }] },
            { id: '10', ports: [{ id: '10a', name: '10a', value: 80 }] },
            {
              id: '11',
              ports: [
                { id: '11a', name: '11a', value: 150 },
                { id: '11b', name: '11b', value: 100 },
                { id: '11d', name: '11d', value: 60 },
                { id: '11c', name: '11c', value: 300 },
              ],
            },
            {
              id: '12',
              ports: [
                { id: '12a', name: '12a', value: 250 },
                { id: '12b', name: '12b', value: 200 },
                { id: '12c', name: '12c', value: 400 },
              ],
            },
          ],
          connections: [
            { sourcePortId: '1a', targetPortId: '2a' },
            { sourcePortId: '2b', targetPortId: '6b' },
            { sourcePortId: '3a', targetPortId: '6a' },
            { sourcePortId: '4a', targetPortId: '7a' },
            { sourcePortId: '5a', targetPortId: '7b' },
            { sourcePortId: '6c', targetPortId: '12a' },
            { sourcePortId: '7c', targetPortId: '12b' },
            { sourcePortId: '8a', targetPortId: '11a' },
            { sourcePortId: '9a', targetPortId: '11b' },
            { sourcePortId: '10a', targetPortId: '11d' },
            { sourcePortId: '11c', targetPortId: '12c' },
          ],
        },
        properties: {
          nodes: {
            type: 'array',
            items: { $ref: '#/components/schemas/Node' },
          },
          connections: {
            type: 'array',
            items: { $ref: '#/components/schemas/Connection' },
          },
        },
      },
      Node: {
        type: 'object',
        required: ['id', 'ports'],
        properties: {
          id: { type: 'string' },
          ports: {
            type: 'array',
            items: { $ref: '#/components/schemas/Port' },
          },
        },
      },
      Port: {
        type: 'object',
        required: ['id', 'name', 'value'],
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          value: { type: ['integer', 'null'] },
        },
      },
      Connection: {
        type: 'object',
        required: ['sourcePortId', 'targetPortId'],
        properties: {
          sourcePortId: { type: 'string' },
          targetPortId: { type: 'string' },
        },
      },
      SegmentResponse: {
        type: 'object',
        required: ['segmentList', 'segmentCount', 'segmentResult'],
        example: {
          segmentList: ['2b', '2a'],
          segmentCount: 2,
          segmentResult: 40,
        },
        properties: {
          segmentList: {
            type: 'array',
            items: { type: 'string' },
          },
          segmentCount: { type: 'integer', minimum: 0 },
          segmentResult: { type: 'integer' },
        },
      },
    },
  },
};
