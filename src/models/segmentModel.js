import { getIncomingConnections, getPortById, getPortsInNode } from './canvasModel.js';

function resolveSources(portId, seen = new Set()) {
  if (seen.has(portId)) {
    return [];
  }

  const port = getPortById(portId);
  if (!port) {
    return [];
  }

  if (port.value !== null && port.value !== undefined) {
    return [{ portId, value: Number(port.value) }];
  }

  const nextSeen = new Set(seen).add(portId);
  const directSourceIds = getIncomingConnections(portId)
    .map((connection) => connection.sourcePortId);
  const sourceIds = directSourceIds.length > 0
    ? directSourceIds
    : getCandidateSourceIds(portId);
  const sourceValues = sourceIds
    .flatMap((sourcePortId) => resolveSources(sourcePortId, nextSeen))
    .reduce((sum, source) => sum + source.value, 0);

  return [{ portId, value: sourceValues }];
}

function getCandidateSourceIds(portId) {
  const targetPort = getPortById(portId);
  if (!targetPort) {
    return [];
  }

  const sameNodePorts = getPortsInNode(targetPort.nodeId)
    .filter((port) => port.id !== portId && getIncomingConnections(port.id).length > 0)
    .map((port) => port.id);
  const directSourceIds = getIncomingConnections(portId)
    .map((connection) => connection.sourcePortId);

  return [...new Set([...sameNodePorts, ...directSourceIds])];
}

function resolvePortIds(portId, seen = new Set()) {
  if (seen.has(portId) || !getPortById(portId)) {
    return [];
  }

  const nextSeen = new Set(seen).add(portId);
  return [
    portId,
    ...getCandidateSourceIds(portId)
      .flatMap((sourcePortId) => resolvePortIds(sourcePortId, nextSeen)),
  ];
}

function getSourcePortsForTarget(portId) {
  const targetPort = getPortById(portId);
  if (!targetPort) {
    return [];
  }

  const sameNodePorts = getPortsInNode(targetPort.nodeId)
    .filter((port) => port.id !== portId);
  const directSourceIds = getIncomingConnections(portId)
    .map((connection) => connection.sourcePortId);
  const candidateIds = directSourceIds.length > 0
    ? new Set(directSourceIds)
    : new Set(
      sameNodePorts
        .filter((port) => getIncomingConnections(port.id).length > 0)
        .map((port) => port.id),
    );

  return [...candidateIds]
    .flatMap((candidateId) => resolveSources(candidateId))
    .filter((source, index, sources) => sources.findIndex((item) => item.portId === source.portId) === index);
}

function resolveSegmentSourceIds(portId, seen = new Set()) {
  if (seen.has(portId)) {
    return [];
  }

  const port = getPortById(portId);
  if (!port) {
    return [];
  }

  if (port.value !== null && port.value !== undefined) {
    return [portId];
  }

  const nextSeen = new Set(seen).add(portId);
  const directSourceIds = getIncomingConnections(portId)
    .map((connection) => connection.sourcePortId);
  const sourceIds = directSourceIds.length > 0
    ? directSourceIds
    : getCandidateSourceIds(portId);

  return sourceIds
    .flatMap((sourcePortId) => resolveSegmentSourceIds(sourcePortId, nextSeen))
    .filter((sourcePortId, index, ids) => ids.indexOf(sourcePortId) === index);
}

export function calculateSegmentForPort(portId) {
  const targetPort = getPortById(portId);

  if (!targetPort) {
    throw new Error(`Port not found: ${portId}`);
  }

  const directSourceIds = getIncomingConnections(portId)
    .map((connection) => connection.sourcePortId);

  // This is for fallback handling
  if ((targetPort.value === null || targetPort.value === undefined) && directSourceIds.length === 1) {
    const sourceSegment = calculateSegmentForPort(directSourceIds[0]);
    if (new Set(sourceSegment.segmentList).size > 1) {
      return sourceSegment;
    }
  }

  const resolvedSources = getSourcePortsForTarget(portId);

  // End of recursive
  if (resolvedSources.length === 0) {
    const hasValue = targetPort.value !== null && targetPort.value !== undefined;
    return {
      segmentList: hasValue ? [portId] : [],
      segmentCount: hasValue ? 1 : 0,
      segmentResult: hasValue
        ? Number(targetPort.value)
        : 0,
    };
  }

  const sourceIds = resolvedSources.map(({ portId: sourcePortId }) => sourcePortId).sort();
  const sourceValues = resolvedSources.map(({ value }) => value);

  const arithmeticTarget = targetPort.value !== null && targetPort.value !== undefined ? Number(targetPort.value) : 0;
  const sourceSum = sourceValues.reduce((sum, value) => sum + value, 0);
  const segmentList = [
    portId,
    ...resolvedSources
      .flatMap(({ portId: sourcePortId }) => resolveSegmentSourceIds(sourcePortId))
      .filter((sourcePortId, index, ids) => ids.indexOf(sourcePortId) === index),
  ];

  return {
    segmentList,
    segmentCount: segmentList.length,
    segmentResult: arithmeticTarget - sourceSum,
  };
}

export function getAccessibleSourcePorts(portId) {
  const targetPort = getPortById(portId);
  if (!targetPort) {
    return [];
  }

  return getSourcePortsForTarget(portId);
}
