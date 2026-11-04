// Fixed limits keep the denser encounters bounded on both quality settings.
export function encounterPlan(time,quality='high') {
  return {
    initial:18,
    interval:Math.max(.32,.68-time*.0018),
    batch:Math.min(8,4+Math.floor(time/35)),
    waveInterval:20,
    waveSize:Math.min(32,14+Math.floor(time/40)*6),
    cap:quality==='low'?140:220,
  };
}
