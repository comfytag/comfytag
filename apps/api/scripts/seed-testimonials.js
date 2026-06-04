import 'dotenv/config'
import mongoose from 'mongoose'
import Testimonials from '../models/Testimonials.js'

const testimonials = [
  { name: 'Tunde Adeyemi', text: 'Bought my ticket in under a minute. No stress, just vibes. ComfyTag is the move.' },
  { name: 'Amaka Osei', text: 'Face check-in was so smooth — walked straight past the queue. My friends were shook.' },
  { name: 'Seun Bello', text: 'Best ticket app in Nigeria right now. The organizer dashboard is fire.' },
  { name: 'Chisom Eze', text: 'Transferred my ticket to my cousin in seconds. No drama, no paper. Love it.' },
]

await mongoose.connect(process.env.MONGO)
try {
  for (const testimonial of testimonials) {
    await Testimonials.findOneAndUpdate({ name: testimonial.name }, testimonial, { upsert: true, new: true })
  }
  console.log(`Seeded ${testimonials.length} testimonials.`)
} finally {
  await mongoose.disconnect()
}
