import { fileURLToPath } from 'node:url';
import { getDatabase, resetDatabase } from './database.js';

const seedData = [
  [1, '1a', 100],
  [2, '2a', 90],
  [2, '2b', 130],
  [3, '3a', 150],
  [4, '4a', 70],
  [5, '5a', 160],
  [6, '6a', null],
  [6, '6b', null],
  [6, '6c', null],
  [7, '7a', null],
  [7, '7b', null],
  [7, '7c', null],
  [8, '8a', 200],
  [9, '9a', 120],
  [10, '10a', 80],
  [11, '11a', 150],
  [11, '11b', 100],
  [11, '11d', 60],
  [11, '11c', 300],
  [12, '12a', 250],
  [12, '12b', 200],
  [12, '12c', 400],
];

const seedConnections = [
  ['1a', '2a'],
  ['2b', '6b'],
  ['3a', '6a'],
  ['4a', '7a'],
  ['5a', '7b'],
  ['6c', '12a'],
  ['7c', '12b'],
  ['8a', '11a'],
  ['9a', '11b'],
  ['10a', '11d'],
  ['11c', '12c'],
];

export function seedDatabase() {
  const connection = resetDatabase();
  const insertNode = connection.prepare('INSERT INTO nodes (id) VALUES (?)');
  const insertPort = connection.prepare(
    'INSERT INTO ports (id, node_id, name, value) VALUES (?, ?, ?, ?)',
  );

  const seed = connection.transaction(() => {
    const nodeIds = [...new Set(seedData.map(([node]) => String(node)))];

    for (const nodeId of nodeIds) {
      insertNode.run(nodeId);
    }

    for (const [node, port, value] of seedData) {
      const portId = String(port);
      const nodeId = String(node);
      insertPort.run(portId, nodeId, portId, value);
    }

    const insertConnection = connection.prepare(
      'INSERT INTO connections (source_port_id, target_port_id) VALUES (?, ?)',
    );

    for (const [sourcePortId, targetPortId] of seedConnections) {
      insertConnection.run(sourcePortId, targetPortId);
    }
  });

  seed();
  return getDatabase();
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const connection = seedDatabase();
  const counts = connection.prepare(`
    SELECT
      (SELECT COUNT(*) FROM nodes) AS nodes,
      (SELECT COUNT(*) FROM ports) AS ports
  `).get();

  console.log(`Seeded ${counts.nodes} nodes and ${counts.ports} ports.`);
}