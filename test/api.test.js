import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../src/app.js';
import { initializeDatabase, resetDatabase } from '../src/services/databaseService.js';
import { insertCanvas } from '../src/models/canvasModel.js';
import { seedDatabase } from '../database/seed.js';

let server;

test.before(async () => {
  initializeDatabase();
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
});

test.after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
});

test('health endpoint reports readiness', async () => {
  const response = await fetch(`http://127.0.0.1:${server.address().port}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: 'ok' });
});

test('canvas endpoint returns empty graph when database is empty', async () => {
  await resetDatabase();

  const response = await fetch(`http://127.0.0.1:${server.address().port}/canvas`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { nodes: [], connections: [] });
});

test('segment endpoint calculates a basic target-source value for a port', async () => {
  await resetDatabase();
  await insertCanvas({
    nodes: [
      {
        id: 'n1',
        ports: [
          { id: 'p1', name: 'left', value: 10 },
          { id: 'p2', name: 'right', value: null },
        ],
      },
    ],
    connections: [{ sourcePortId: 'p1', targetPortId: 'p2' }],
  });

  const response = await fetch(`http://127.0.0.1:${server.address().port}/segments/p2`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    segmentList: ['p2', 'p1'],
    segmentCount: 2,
    segmentResult: -10,
  });
});

test('segment endpoint resolves sources for a valued port', async () => {
  await resetDatabase();
  await insertCanvas({
    nodes: [
      {
        id: 'n1',
        ports: [
          { id: 'p1', name: 'left', value: 10 },
          { id: 'p2', name: 'right', value: 5 },
        ],
      },
    ],
    connections: [{ sourcePortId: 'p1', targetPortId: 'p2' }],
  });

  const response = await fetch(`http://127.0.0.1:${server.address().port}/segments/p2`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    segmentList: ['p2', 'p1'],
    segmentCount: 2,
    segmentResult: -5,
  });
});

test('seed script includes every port referenced by a connection', () => {
  const db = seedDatabase();

  const missingReferences = db.prepare(`
    SELECT c.source_port_id, c.target_port_id
    FROM connections c
    LEFT JOIN ports sp ON sp.id = c.source_port_id
    LEFT JOIN ports tp ON tp.id = c.target_port_id
    WHERE sp.id IS NULL OR tp.id IS NULL
  `).all();

  assert.deepEqual(missingReferences, []);
});

test('segment endpoint calculates the seeded result for port 2b', async () => {
  seedDatabase();

  const response = await fetch(`http://127.0.0.1:${server.address().port}/segments/2b`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    segmentList: ['2b', '2a'],
    segmentCount: 2,
    segmentResult: 40,
  });
});

test('segment endpoint resolves a null source recursively for 12b', async () => {
  seedDatabase();

  const response = await fetch(`http://127.0.0.1:${server.address().port}/segments/12b`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    segmentList: ['12b', '4a', '5a'],
    segmentCount: 3,
    segmentResult: -30,
  });
});

test('segment endpoint returns only 1a when it has no source ports', async () => {
  seedDatabase();

  const response = await fetch(`http://127.0.0.1:${server.address().port}/segments/1a`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    segmentList: ['1a'],
    segmentCount: 1,
    segmentResult: 100,
  });
});

test('segment endpoint delegates null port 6b to its direct source segment', async () => {
  seedDatabase();

  const response = await fetch(`http://127.0.0.1:${server.address().port}/segments/6b`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    segmentList: ['2b', '2a'],
    segmentCount: 2,
    segmentResult: 40,
  });
});
