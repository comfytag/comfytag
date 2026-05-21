import mongoose from 'mongoose';
const { Schema } = mongoose;


const WithdrawSchema = new Schema(
    {
user_id: {
    type: String,
    required: true,
},
bankName: {
    type: String,
    required: true,
},
acctName: {
    type: String,
    required: true,
},
acctNumber: {
    type: String,
    required: true,
},
eventName: {
    type: String,
    required: true,
},
amount:{
    type: Number,
    required: true,
},
status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'sent'],
    default: 'pending'
}
},
{timestamps: true}
);


export default mongoose.model("Withdraw", WithdrawSchema)