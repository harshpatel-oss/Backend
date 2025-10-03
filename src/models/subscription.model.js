import mongoose , { Schema } from 'mongoose';

const subscriptionSchema = new Schema({
    subscriber : 
    {
        type : mongoose.Schema.Types.ObjectId, // one who is subscribing
        ref : 'User',
        required : true
    },
    channel : {
        type : mongoose.Schema.Types.ObjectId, // one who is being subscribed to
        ref : 'User',
        required : true
    }
},
{
    timestamps:true
})


export const Subscription = mongoose.model('Subscription' , subscriptionSchema);