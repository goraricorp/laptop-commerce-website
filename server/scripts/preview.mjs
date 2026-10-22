import process from 'node:process'
import app from '../dist/index.js'
const server=app.listen(Number(process.env.PORT??5172),'127.0.0.1',()=>console.log('Express Vite artifact preview ready'))
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)))
