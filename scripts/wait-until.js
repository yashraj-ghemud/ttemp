const target = process.argv[2];
if(!target) throw new Error("Usage: node scripts/wait-until.js <ISO timestamp>");
const targetMs=Date.parse(target);
if(!Number.isFinite(targetMs)) throw new Error(`Invalid timestamp: ${target}`);
const MAX_SLEEP_MS=2*60*1000;
while(true){const remaining=targetMs-Date.now();if(remaining<=0){console.log("Start time reached; continuing.");break}const sleep=Math.min(remaining,MAX_SLEEP_MS);console.log(`Waiting ${(sleep/1000).toFixed(0)}s; remaining ${(remaining/60000).toFixed(1)} min`);await new Promise(r=>setTimeout(r,sleep))}
