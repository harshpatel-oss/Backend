import { Router } from "express";
import { 
       registerUser,
       loginUser ,
       logoutUser ,
       refreshAccessToken,
       changeCurrentUserPassword ,
       getCurrentUser ,
       updateAccountDetails ,
       updateUserAvatar ,
       updateUserCoverImage,
       getUserChannelProfile,
       getWatchHistory
} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { get } from "mongoose";

const router = Router();

router.route('/register').post(
    upload.fields([
        {   
             name:"avatar",
             maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]) ,
    registerUser
)

router.route('/login').post(loginUser)

//secured routes - verifyJWT middleware lagana pdta hae

router.route("/logout").post(verifyJWT,logoutUser) //logoutUser
router.route("/refresh-token").post(refreshAccessToken) //refresh token
router.route("/change-password").post(verifyJWT,changeCurrentUserPassword) //change password
router.route("/current-user").get(verifyJWT,getCurrentUser) //get current user details
router.route("/update-account-details").patch(verifyJWT,updateAccountDetails) //update account details
//why patch? bcoz we are updating some details of the user
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar) //update user avatar
router.route("/coverImage").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage) //update user cover image
router.route("/channel/:username").get(getUserChannelProfile) //get user channel profile by username
router.route("/watch-history").get(verifyJWT,getWatchHistory) //get user's watch history


export default router;