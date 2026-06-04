import 'dotenv/config'
import mongoose from 'mongoose'
import Category from '../models/Category.js'

const categories = [
  { title: 'music', slug: 'music', icon: '🎵', gradient: 'linear-gradient(135deg, #7C3AED, #8B5CF6)', sortOrder: 1 },
  { title: 'parties', slug: 'parties', icon: '🎉', gradient: 'linear-gradient(135deg, #EC4899, #F472B6)', sortOrder: 2 },
  { title: 'tech', slug: 'tech', icon: '💻', gradient: 'linear-gradient(135deg, #0EA5E9, #38BDF8)', sortOrder: 3 },
  { title: 'sports', slug: 'sports', icon: '⚽', gradient: 'linear-gradient(135deg, #10B981, #34D399)', sortOrder: 4 },
  { title: 'arts', slug: 'arts', icon: '🎨', gradient: 'linear-gradient(135deg, #F59E0B, #FBBF24)', sortOrder: 5 },
  { title: 'comedy', slug: 'comedy', icon: '😂', gradient: 'linear-gradient(135deg, #EF4444, #F87171)', sortOrder: 6 },
  { title: 'food', slug: 'food', icon: '🍽️', gradient: 'linear-gradient(135deg, #D97706, #F59E0B)', sortOrder: 7 },
  { title: 'networking', slug: 'networking', icon: '💼', gradient: 'linear-gradient(135deg, #6366F1, #818CF8)', sortOrder: 8 },
]

await mongoose.connect(process.env.MONGO)
try {
  for (const cat of categories) {
    await Category.findOneAndUpdate({ slug: cat.slug }, cat, { upsert: true, new: true })
  }
  console.log(`Seeded ${categories.length} categories.`)
} finally {
  await mongoose.disconnect()
}
