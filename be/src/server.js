import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './libs/db.js';
import authRoute from './routes/authRoute.js';
import userRoute from './routes/userRoute.js';
import friendRoute from './routes/friendRoute.js';
import messageRoute from './routes/messageRoute.js';
import conversationRoute from './routes/conversationRoute.js';
import cookieParser from 'cookie-parser';
import { protectedRoute } from './middlewares/authMiddleware.js';
import swaggerUi from 'swagger-ui-express'
import fs from 'fs'
import { app, server } from './socket/index.js'
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

// const app = express();
const PORT = process.env.PORT || 8081;

//middleware
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

//cloudinary configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

//swagger
const swaggerDocument = JSON.parse(fs.readFileSync("./src/swagger.json", "utf-8"))
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument))

//public routes
app.use('/api/auth', authRoute);

//private routes
app.use('/api/users', protectedRoute, userRoute);
app.use('/api/friends', protectedRoute, friendRoute);
app.use('/api/messages', protectedRoute, messageRoute);
app.use('/api/conversations', protectedRoute, conversationRoute);


connectDB().then(() => {
    server.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
});
