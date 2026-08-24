import mongoose from 'mongoose';
const { Schema } = mongoose;


const WithdrawSchema = new Schema(
    {
user_id: {
    type: String,
    required: true,
},
bankId: {
    // Reference to the resolved Bank doc this payout goes to — lets
    // processPayout look up the Paystack recipientCode directly instead of
    // fuzzy-matching by bankName/acctNumber strings.
    type: Schema.Types.ObjectId,
    ref: 'Banks',
    default: null,
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
    // pending: awaiting admin action
    // approved: admin approved, not yet sent to Paystack (legacy/manual step)
    // processing: Paystack accepted the transfer request, awaiting confirmation
    // sent: transfer.success webhook confirmed the money moved
    // failed: transfer.failed/transfer.reversed after being initiated
    // rejected: admin declined the request before any money movement
    type: String,
    enum: ['pending', 'approved', 'processing', 'sent', 'failed', 'rejected'],
    default: 'pending'
},
transferCode: {
    type: String,
    default: null,
},
transferReference: {
    type: String,
    default: null,
},
failureReason: {
    type: String,
    default: null,
},
},
{timestamps: true}
);


export default mongoose.model("Withdraw", WithdrawSchema)