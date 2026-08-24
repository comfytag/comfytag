import mongoose from 'mongoose'
const { Schema } = mongoose

const WalletSchema = new Schema(
  {
    user_id: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, default: 0 },
    transactions: [
      {
        type: { type: String, enum: ['credit', 'debit'] },
        amount: { type: Number },
        reason: { type: String },
        referenceId: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
)

export default mongoose.model('Wallet', WalletSchema)
