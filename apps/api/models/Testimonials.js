import mongoose from 'mongoose';
const { Schema } = mongoose;

const TestimonialSchema = new Schema({
    name: {
        type: String,
        required: true,
        lowercase: true,
    },
    text:{
        type: String,
        required: true,
    }
},
{timestamps: true});

export default mongoose.model("Testimonial", TestimonialSchema)