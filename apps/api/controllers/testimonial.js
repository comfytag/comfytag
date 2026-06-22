import Testimonial from '../models/Testimonials.js'


// CREATE
export const createTestimonial = async (req,res,next) =>{
    const newTestimonial = new Testimonial (req.body);
    try{
        const savedTestimonial = await newTestimonial.save()
        res.status(200).json(savedTestimonial)
    }catch(err){
        next(err)
    }
}


// DELETE
export const deleteTestimonial = async (req,res,next) =>{
    try{
        await Testimonial.findByIdAndDelete(
            req.params.id
        )
        res.status(200).json('Testimonial has been deleted')
    }catch(err){
        next(err)
    }
}

// GET
export const getTestimonial = async (req,res,next) =>{
    try{
        const getTestimonial = await Testimonial.findById({_id: req.params.id})
        res.status(200).json(getTestimonial)
    }catch(err){
        next(err)
    }
}

// GET ALL — public endpoint returns only approved testimonials, sorted.
// Admin callers can pass ?all=true to bypass the isApproved filter.
export const getAllTestimonials = async (req, res, next) => {
    try {
        const filter = req.query.all === 'true' ? {} : { isApproved: true }
        const getTestimonials = await Testimonial.find(filter).sort({ sortOrder: 1, createdAt: -1 })
        res.status(200).json(getTestimonials)
    } catch (err) {
        next(err)
    }
}
