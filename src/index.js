//require('dotenv').config({path: './.env'}) //ye bhi use kar skte hai env variable ko access krne k liye

import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import mongoose from "mongoose";
import { DB_NAME } from "./constant.js";
import connectDB from "./db/index.js";


connectDB()
.then(()=>{
    console.log("MONGODB CONNECTED SUCCESSFULLY")       
    app.listen(process.env.PORT ||  8000 , ()=>{
        console.log(`Server is listening on port ${process.env.PORT || 8000}`)
    })
})
.catch((err)=>{
    console.log("MONGODB CONNECTION FAILED : ", err)
})






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
