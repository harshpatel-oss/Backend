import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import {uploadOnCloudinary} from '../utils/cloudinary.js';  
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

const generateAccessAndRefreshToken = async (userId) =>{
  try{
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave:false});
    return {accessToken , refreshToken };
  }
  catch(error){
    throw new ApiError(500 , 'Something went wrong while generating refresh and access tokens');
  }
}

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

        const avatarLocalPath = req.files?.avatar?.[0]?.path; 
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
    //steps to login a user ->
    //1. get user details from frontend req.body
    //2. username and email
    //3. find the user
    //4. password check
    //5. generate access token and refresh token
    //6. send cookies and response

    const {email ,username , password} = req.body;

    if(!username && !email){
        throw new ApiError(400 , "Username or email is required to login");
    }

    const user = await User.findOne({
        $or:[
            {username}, 
            {email}
        ]
    });

    if(!user){
        throw new ApiError(404 , "User not found, please register");
    }   

    const isPasswordValid = await user.isPasswordCorrect(password); //ye method maine user model me banaya hai
    if(!isPasswordValid){
        throw new ApiError(401 , "Invalid user credentials");
    }

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken "
          );

      const options = {
        httpOnly:true,
        secure:true
      }    

        return res
        .status(200)
        .cookie('accessToken' , accessToken , options)
        .cookie('refreshToken' , refreshToken , options)
        .json(
            new ApiResponse(
                200 ,
                {user:loggedInUser , accessToken , refreshToken} ,
                'User logged in successfully'
                )
            //access token and refresh token is also sent in response body for client side storage if needed acchhi practice hai
        );


}); 

const logoutUser = asyncHandler(async (req, res) => {
    
    //req.user is set in verifyJWT middleware
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        },
        {
            new:true
        }
    );
    const options = {
        httpOnly:true,
        secure:true,
    }
    return res
    .status(200)
    .cookie("accessToken",options) //cookie ko expire krdo
    .cookie("refreshToken",options)
    .json(
        new ApiResponse(200 , {} , "User logged out successfully")
    );  

});

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken
    ;

    if(!incomingRefreshToken){
        throw new ApiError(401 , "Unauthorized request");
    }

   try {
    const decodedToken =  jwt.verify(
         incomingRefreshToken, 
         process.env.REFRESH_TOKEN_SECRET , 
         )
 
     const user = await User.findById(decodedToken?._id)
 
     if(!user){
         throw new ApiError(401 , "Invalid refresh token");
     }
 
     if(user.refreshToken !== incomingRefreshToken){
         throw new ApiError(401 , "Refresh token mismatch, login again");
     }
 
     const options = {
         httpOnly:true,
         secure:true
       }
 
     const {accessToken , newRefreshToken} = await generateAccessAndRefreshToken(user._id);
 
     return res
     .status(200)
     .cookie('accessToken' , accessToken , options)
     .cookie('refreshToken' , newRefreshToken , options)
     .json(
         new ApiResponse(
             200 ,
             {accessToken , newRefreshToken} ,
             'Access token refreshed successfully'
             )
         //access token and refresh token is also sent in response body for client side storage if needed acchhi practice hai
     );
   } 
   catch (error) 
   {
    throw new ApiError(401 , error.message || "Invalid refresh token");
   }

    
});

const changeCurrentUserPassword = asyncHandler(async (req, res) => {
     const {oldPassword , newPassword} = req.body;

     const user = await User.findById(req.user._id);

     if(!user){
        throw new ApiError(404 , "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400 , "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false});

    return res
    .status(200)
    .json(
        new ApiResponse(200 , {} , "Password changed successfully")
    );
     
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200 , req.user , "Current user fetched successfully")
    );
});

const updateAccountDetails = asyncHandler(async (req, res) => {
    const {fullName , username , email } = req.body;
    const updatedData = {};

    if(fullName?.trim() === ''){
        throw new ApiError(400 , "Full name cannot be empty");
    }   
    if(username?.trim() === ''){
        throw new ApiError(400 , "Username cannot be empty");
    }  
    if(email?.trim() === ''){
        throw new ApiError(400 , "Email cannot be empty");
    }  
    User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullName:fullName ,
                username:username?.toLowerCase(),
                email:email
            }
        },
        {
            new:true //yeh updated user return karega
        }
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200 , updatedUser , "User details updated successfully")
    )

});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is required");
    }   

    const avatar = await uploadOnCloudinary
    (avatarLocalPath);

    if(!avatar.url){
        throw new ApiError(500 , "Error while uploading avatar, please try again");
    }   

    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{  
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select("-password");

    return res
    .status(200)
    .json(
        new ApiResponse(200 , updatedUser , "User avatar updated successfully")
    );  
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400 , "Cover image file is missing");
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    //ye function maine cloudinary.js me banaya hai aur ye object return krta hai jisme url hota hai uploaded file ka
    if(!coverImage.url){
        throw new ApiError(500 , "Error while uploading cover image, please try again");
    }

    const updatedUser = await User.findByIdAndUpdate(   
        req.user?._id,
        {
            $set:{  
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select("-password");  


    return res
    .status(200)
    .json(
        new ApiResponse(200 , updatedUser , "User cover image updated successfully")
    );  

});

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params;

    if(!username?.trim()){  
        throw new ApiError(400 , "Username is missing");
    }
    
    const channel = User.aggregate([
        {
            $match:{        
                username : username?.toLowerCase()
                },
        },
        {
            $lookup:{
                from:"subscriptions", //ye mongodb collection ka naam hai
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions", //ye mongodb collection ka naam hai
                localField:"_id",
                foreignField:"subscriber",
                as:"subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed:{
                    $cond:{
                        if:{
                            $in:[req.user?._id , "$subscribers.subscriber"]
                        },
                        then:true,
                        else:false
                    }
                }
            }
        },
        {
            $project:{//fields to be included in the response
                fullName:1,
                username:1,
                subscribersCount:1,
                channelSubscribedToCount:1,
                isSubscribed:1, 
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404 , "Channel does not exist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200 , channel[0] , "Channel profile fetched successfully")
        //ek object return karne ka fayde hae ki frontend pe seedha use kar sakte hain
    );

});
   

export { 

       registerUser,
       loginUser ,
       logoutUser ,
       refreshAccessToken,
       changeCurrentUserPassword ,
       getCurrentUser ,
       updateAccountDetails ,
       updateUserAvatar ,
       updateUserCoverImage,
       getUserChannelProfile 
       };