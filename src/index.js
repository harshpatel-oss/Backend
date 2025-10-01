//require('dotenv').config({path: './.env'}) //ye bhi use kar skte hai env variable ko access krne k liye

import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import mongoose from "mongoose";
import { DB_NAME } from "./constant.js";
import connectDB from "./db/index.js";


connectDB()






// // one approach of connecting database

// import express from "express";
// const app = express()
// ;(async ()=> {
//     try{
//       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//       app.on("error", ()=>{
//         console.error("ERROR : ", error)        
//         throw error
//       })
//         app.listen(process.env.PORT, ()=>{  
//             console.log(`Server is listening on port ${process.env.PORT}`)    
//     })
//     }
//     catch(error){
//         console.error("ERROR :" ,error)  
//         throw error
//       }
// })()
