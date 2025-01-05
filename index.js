import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
// import { handleWebSocketConnection } from './routes/NayaRoute.js';
import {handleWebSocketConnection} from './routes/supernew.js';
import connectToDB from './config/db.js';
import cors from 'cors';
import { convertDate } from './config/dateHelper.js';
import mainRouter from './routes/index.js';
import { findCandidateByCandidateId } from './helpers/feedback.js';


const app = express();
const port = process.env.PORT || 8080;


const allowedOrigins = ['https://saksham-green.vercel.app', 'https://saksham.quizai.tech','https://cron-job.org','http://localhost:5173'];
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE'],
  credentials: true,
  allowedHeaders: ['X-CSRF-Token', 'X-Requested-With', 'Accept', 'Accept-Version', 'Content-Length', 'Content-MD5', 'Content-Type', 'Date', 'X-Api-Version', 'Authorization']
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(mainRouter);





// Initialize HTTP server
const server = http.createServer(app);


// Initialize WebSocket server
const wss = new WebSocketServer({ server });
connectToDB();

wss.on('connection', (ws, req) => {
  handleWebSocketConnection(ws, req);
});

// Example route
app.get('/', (req, res) => {
  res.send('Express server with WebSocket is running!');
});

// Start the server
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
