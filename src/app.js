import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN ,
    credentials: true
}));

app.use(express.json({limit:'16kb'}));
app.use(express.urlencoded({ extended: true ,limit:'16kb'}));
app.use(express.static('public'));
app.use(cookieParser());
//cookie parser middleware lagaya ab hum cookies ko read kr payenge



//routes    

import userRouter from './routes/user.routes.js';

//routes declaration
// ab router ko alag se likh rhe hae to router lane k liye middleware use krna pdta hae
// /users yaha pe prefix hae jo sare user routes k sath lgana hae
// http://localhost:5000/api/v1/users/login
// http://localhost:5000/api/v1/users/register

app.use('/api/v1/users', userRouter);

export default app;// module.exports = app;