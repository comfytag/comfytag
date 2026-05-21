import mongoose from 'mongoose';
const { Schema } = mongoose;

const BankSchema = new Schema({
    
    user_id: {
        type: String,
        required: true,
        // unique: true,
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
    isActive: {
        type: Boolean,
        default: false,
    }  
},
{timestamps: true}
);


export default mongoose.model("Banks", BankSchema)
