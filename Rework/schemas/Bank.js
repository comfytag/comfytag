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
    bankCode: {
        // Paystack's numeric bank code (e.g. "058" for GTBank) — required for
        // account resolution and transfer recipient creation. Non-required at
        // the schema level so pre-existing Bank docs created before this field
        // existed don't break; enforced at the application level on create.
        type: String,
        default: null,
    },
    acctName: {
        type: String,
        required: true,
    },
    acctNumber: {
        type: String,
        required: true,
    },
    recipientCode: {
        // Paystack transfer recipient code, created once the account is resolved.
        // Payouts against this Bank doc are blocked until this is set.
        type: String,
        default: null,
    },
    isActive: {
        type: Boolean,
        default: false,
    }
},
{timestamps: true}
);


export default mongoose.model("Banks", BankSchema)
