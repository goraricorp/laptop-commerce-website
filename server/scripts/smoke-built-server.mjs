import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import process from "node:process";
const code = `
 const {default:app}=await import('./src/index.js');
 if(typeof app!=='function'||typeof app.listen!=='function')throw Error('Expected native Express export');
 const server=app.listen(0,'127.0.0.1',async()=>{
  try{
   const base='http://127.0.0.1:'+server.address().port;
   const health=await fetch(base+'/health',{headers:{origin:'http://localhost:5173'}});
   if(health.status!==200||health.headers.get('x-powered-by')||health.headers.get('x-content-type-options')!=='nosniff'||health.headers.get('access-control-allow-origin')!=='http://localhost:5173')throw Error('HTTP middleware boundary failed');
   if((await health.json()).status!=='ok')throw Error('Unexpected health body');
   const malformed=await fetch(base+'/newsletter/subscribe',{method:'POST',headers:{'content-type':'application/json'},body:'{invalid'});
   if(malformed.status!==400)throw Error('Expected JSON error');
   const noSession=await fetch(base+'/checkout/quote',{method:'POST',headers:{'content-type':'application/json'},body:'{}'});
   if(noSession.status!==401)throw Error('Expected auth protection');
   console.log('PASS Node '+process.versions.node+' loads the Vercel Express entrypoint: Helmet, CORS, JSON error and auth guard');
  }catch(error){console.error(error.message);process.exitCode=1}finally{server.close()}
 });
`;
const child = spawn("node", ["--input-type=module", "-e", code], {
  cwd: new URL("..", import.meta.url),
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://unused:unused@127.0.0.1:1/unused",
    BETTER_AUTH_SECRET:
      "node-artifact-smoke-fixture-secret-not-for-production-12345",
    BETTER_AUTH_URL: "http://127.0.0.1:5172/auth",
    VITE_PUBLIC_CLIENT_URL: "http://localhost:5173",
    VITE_PUBLIC_SERVER_URL: "http://127.0.0.1:5172",
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    BETTER_AUTH_API_KEY: "",
    STRIPE_SECRET_KEY: "",
    STRIPE_WEBHOOK_SECRET: "",
    PAYPAL_ENABLED: "false",
    MOMO_ENABLED: "false",
    ZALOPAY_MERCHANT_ENABLED: "false",
  },
});
let output = "";
child.stdout.on("data", (chunk) => (output += chunk.toString()));
child.stderr.on("data", () => {});
const timeout = setTimeout(() => child.kill("SIGTERM"), 20000);
const result = await new Promise((resolve) => {
  child.once("error", () => resolve(1));
  child.once("exit", (code) => resolve(code ?? 1));
});
clearTimeout(timeout);
if (result !== 0 || !output.includes("PASS Node"))
  throw Error(
    "Built server smoke failed; no cloud or provider endpoints were used.",
  );
assert.match(output, /Vercel Express entrypoint/);
console.log(output.trim());
