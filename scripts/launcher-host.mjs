// Only the desktop launcher owns this private stdin pipe. No shutdown HTTP route.
import {createInterface} from 'node:readline';
const {shutdownStudio}=await import('../apps/server/src/index.ts');
const input=createInterface({input:process.stdin});
let stopping;
function stop(){
  stopping??=(async()=>{await shutdownStudio();input.close();process.exit(0);})();
  void stopping.catch(error=>{console.error(error);process.exit(1);});
}
input.on('line',line=>{if(line==='shutdown')stop();});
input.on('close',stop);
