import express from "express";
const app = express();
app.get("/health", (_req,res)=>res.json({ok:true,ts:new Date().toISOString()}));
app.get("/", (_req,res)=>res.send("smoke ok"));
const port = process.env.PORT || 8080;
app.listen(port, ()=>console.log("smoke listening on", port));
