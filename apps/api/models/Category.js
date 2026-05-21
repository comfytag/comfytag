import mongoose from 'mongoose';
const { Schema } = mongoose;

const CategorySchema = new Schema({
    title: {
        type: String,
        required: true,
        lowercase: true,
    },
    image: {
        type: String,
        default: '',
    },
    description:{
        type: String,
        default: '',
    },
    slug: { type: String, lowercase: true },
    icon: { type: String, default: '🎵' },
    gradient: { type: String, default: 'linear-gradient(135deg, #7C3AED, #8B5CF6)' },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
},
{timestamps: true});

export default mongoose.model("Category", CategorySchema)