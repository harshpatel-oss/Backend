import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';  
import {ApiResponse} from '../utils/ApiResponse.js';
const registerUser = asyncHandler(async (req, res) => {
    // //Registration logic here
    // //steps to register a user ->
    //1. get user details from frontend
    //2. validate user details - not empty
    //3. check if user already exists : username , email
    //4. check for images , check for avatar
    //5. upload them to cloudinary , avatar
    //6.  create user object - create entry in db
    //7. remove password and refresh token field from response
    //8. check for user creation success
    //9. send success response to frontend

      const {fullName , email ,username , password} = req.body;

      if(
            [fullName , email ,username , password].some((field)=>field?.trim() === '')
        ){
             throw new ApiError(400 , 'Full name is required');
        }

      const existedUser = await User.findOne({
         $or:[{username} , {email}]
       });

       if(existedUser){
        throw new ApiError(409 , 'User already exists with this email or username');
         }

        const avatarLocalPath = req.files?.avatar[0]?.path; 
        //const coverImageLocalPath = req.files?.coverImage[0]?.path;

        let coverImageLocalPath;
        if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
            coverImageLocalPath = req.files.coverImage[0].path;
        }

        if(!avatarLocalPath){
            throw new ApiError(400 , 'Avatar is required');
        }   
        //cover image is optional

        const avatar = await uploadOnCloudinary(avatarLocalPath);
        const coverImage = await uploadOnCloudinary(coverImageLocalPath);

      

        if(!avatar){
            throw new ApiError(500 , 'Avatar upload failed, please try again');
        }

        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            username : username.toLowerCase(),
            password
        });

       const createdUser = await User.findById(user._id).select(
        "-password -refreshToken "
          );

        if(!createdUser){
        throw new ApiError(500 , 'Something went erong while registering user');
         }

         return res.status(201).json(// yaha 201 status code dena jaruri nahi hai but best practice hai
            new ApiResponse(201 , createdUser , 'User registered successfully') //status code ,data , message
         );


});

const loginUser = asyncHandler(async (req, res) => {
    // Login logic here
        res.status(200).json({
         message: 'User logged in successfully' 
    });
}); 

export { registerUser, loginUser };