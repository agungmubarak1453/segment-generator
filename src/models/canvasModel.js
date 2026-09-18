import { createRow, readRow } from '../services/databaseService.js';

export function insertCanvas(canvas) {
  createRow('nodes', (canvas.nodes ?? []).map((node) => ({ id: node.id })));
  createRow(
    'ports',
    (canvas.nodes ?? []).flatMap((node) => (node.ports ?? []).map((port) => ({
      id: port.id,
      node_id: node.id,
      name: port.name,
      value: port.value,
    }))),
  );
  createRow(
    'connections',
    (canvas.connections ?? []).map((connection) => ({
      source_port_id: connection.sourcePortId ?? connection.source_port_id,
      target_port_id: connection.targetPortId ?? connection.target_port_id,
    })),
  );
}

export function getCanvasModel() {
  const nodes = readRow('nodes', { orderBy: ['id'] });
  const ports = readRow('ports', { orderBy: ['node_id', 'name', 'id'] });

  const nodeMap = new Map(nodes.map((node) => [node.id, { id: node.id, ports: [] }]));

  for (const port of ports) {
    nodeMap.get(port.node_id)?.ports.push({
      id: port.id,
      name: port.name,
      value: port.value,
    });
  }

  const connections = readRow('connections', { orderBy: ['id'] }).map((connection) => ({
    sourcePortId: connection.source_port_id,
    targetPortId: connection.target_port_id,
  }));

  return {
    nodes: [...nodeMap.values()],
    connections,
  };
}

export function getPortById(portId) {
  const port = readRow('ports', { where: { id: portId } })[0];
  return port ? { ...port, nodeId: port.node_id } : null;
}

export function getIncomingConnections(portId) {
  return readRow('connections', {
    where: { target_port_id: portId },
    orderBy: ['source_port_id'],
  }).map((connection) => ({
    sourcePortId: connection.source_port_id,
    targetPortId: connection.target_port_id,
  }));
}

export function getPortsInNode(nodeId) {
  return readRow('ports', {
    where: { node_id: nodeId },
    orderBy: ['name', 'id'],
  });
}
