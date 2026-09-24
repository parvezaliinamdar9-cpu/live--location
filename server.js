const express=require('express'); const http=require('http'); const {Server}=require('socket.io'); const path=require('path');
const app=express(), server=http.createServer(app), io=new Server(server), PORT=process.env.PORT||10000; const rooms=new Map();
app.use(express.static(path.join(__dirname,'public'))); app.get('*',(q,s)=>s.sendFile(path.join(__dirname,'public','index.html')));
io.on('connection',socket=>{
 socket.on('join-room',({room,role})=>{if(!room||!['sharer','viewer'].includes(role))return; socket.join(room); socket.data.room=room; socket.data.role=role; if(role==='viewer'&&rooms.has(room)) socket.emit('location-update',rooms.get(room));});
 socket.on('location-update',d=>{const room=socket.data.room;if(socket.data.role!=='sharer'||!room)return;const lat=Number(d?.lat),lon=Number(d?.lon);if(!Number.isFinite(lat)||!Number.isFinite(lon))return;const p={lat,lon,accuracy:Number.isFinite(Number(d.accuracy))?Number(d.accuracy):null,time:Date.now()};rooms.set(room,p);socket.to(room).emit('location-update',p);});
 socket.on('stop-sharing',()=>{const r=socket.data.room;if(socket.data.role==='sharer'&&r){rooms.delete(r);socket.to(r).emit('sharing-stopped');}});
 socket.on('disconnect',()=>{const r=socket.data.room;if(socket.data.role==='sharer'&&r){rooms.delete(r);socket.to(r).emit('sharing-stopped');}});
}); server.listen(PORT,()=>console.log('Listening on '+PORT));
