import Category from '../models/Category.js'


// CREATE
export const createCategory = async (req,res,next) =>{
    const newCategory = new Category (req.body);
    try{
        const savedCategory = await newCategory.save()
        res.status(200).json(savedCategory)
    }catch(err){
        next(err)
    }
}

// UPDATE
export const updateCategory = async (req,res,next) =>{
    try{
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
           { $set: req.body },
           {new: true}
        )

        res.status(200).json(updatedCategory)
    }catch(err){
        next(err)
    }
}

// DELETE
export const deleteCategory = async (req,res,next) =>{
    try{
        await Category.findByIdAndDelete(
            req.params.id
        )
        res.status(200).json('Category has been deleted')
    }catch(err){
        next(err)
    }
}

// GET
export const getCategory = async (req,res,next) =>{
    try{
        const getCategory = await Category.findById({_id: req.params.id})
        res.status(200).json(getCategory)
    }catch(err){
        next(err)
    }
}

// GET ALL
export const getAllCategories = async (req,res,next) =>{
    try{
        const getCategories = await Category.find( )
        res.status(200).json(getCategories)
    }catch(err){
        next(err)
    }
}
