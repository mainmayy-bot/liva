export function layoutTimelineItems(items) {
  const sorted = [...items].sort(
    (a, b) => a.start - b.start || String(a.id).localeCompare(String(b.id)),
  );
  const result = new Map();
  let cluster = [];
  let clusterEnd = -Infinity;

  const placeCluster = () => {
    if (!cluster.length) return;
    const laneEnds = [];
    const placed = cluster.map((item) => {
      let lane = laneEnds.findIndex((end) => end <= item.start);
      if (lane === -1) lane = laneEnds.length;
      laneEnds[lane] = item.start + Math.max(0.5, Number(item.duration) || 1);
      return { item, lane };
    });
    const laneCount = Math.max(1, laneEnds.length);
    placed.forEach(({ item, lane }) => {
      result.set(item.id, { lane, laneCount });
    });
    cluster = [];
    clusterEnd = -Infinity;
  };

  sorted.forEach((item) => {
    const end = item.start + Math.max(0.5, Number(item.duration) || 1);
    if (cluster.length && item.start >= clusterEnd) placeCluster();
    cluster.push(item);
    clusterEnd = Math.max(clusterEnd, end);
  });
  placeCluster();
  return result;
}
