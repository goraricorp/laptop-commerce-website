import express from "express";
import AppModule from "./module.js";
// Export the app without opening a listener or starting background timers.
const app = express();
app.disable("x-powered-by");
app.use(AppModule());
export default app;
