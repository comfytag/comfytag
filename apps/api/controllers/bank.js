// import {Bank, Withdraw} from '../models/Bank.js'
import Bank from '../models/Bank.js';
import Withdraw from '../models/Withdraw.js';
import User from '../models/User.js';


// CREATE Bank

export const createBank = async (req, res, next) => {
    const userId = req.params.userId;
    const acctName =   await User.findById(userId)

    const newBank = new Bank({
        ...req.body,
        user_id: userId,
        acctName: acctName.name,
     });
    try {
        const savedBank = await newBank.save()
      
        res.status(200).json(savedBank)
    } catch (err) {
        next(err)
    }
}

// UPDATE
export const updateBank = async (req,res,next) =>{
    try{
        const updatedBank = await Bank.findByIdAndUpdate(
            req.params.id,
           { $set: req.body},
           {new: true}
        )
        res.status(200).json(updatedBank)
    }catch(err){
        next(err)
    }
}


// DELETE
export const deleteBank = async (req,res,next) =>{
    try{
        await Bank.findByIdAndDelete(
            req.params.id
        )
        res.status(200).json('Bank has been deleted')
    }catch(err){
        next(err)
    }
}

// GET
export const getBank = async (req,res,next) =>{
    try{
        const getBank = await Bank.find({user_id: req.params.userId})
            res.status(200).json(getBank)
    }catch(err){
        next(err)
    }
}

// GET ALL
export const getAllBanks = async (req,res,next) =>{

    try{
        const getBanks = await Bank.find()
        res.status(200).json(getBanks)
    }catch(err){
        next(err)
    }
}

// GET
export const updateBankStatus = async (req,res,next) =>{
        try {
            const updateStatus = await Bank.findByIdAndUpdate(
                req.params.bankId,
            { $set: req.body},
            {new: true})
            res.status(200).json(updateStatus)
        } catch (err) {
            next(err)
        }
}






// Withdrawal

// CREATE Bank
export const createWithdraw = async (req, res, next) => {
    const userId = req.params.userId;


    const newWithdraw = new Withdraw({
        ...req.body,
         user_id: userId,
        //  acctName: acct_name,
        //  acctNumber: paymentDetails.acctNumber,
        //  bankName: paymentDetails.bankName

     });
        try {
        const savedWithdraw = await newWithdraw.save()
        res.status(200).json(savedWithdraw)
    } catch (err) {
        next(err)
    }
}


// UPDATE
export const updateWithdraw = async (req,res,next) =>{
    try{
        const updatedWithdraw = await Withdraw.findByIdAndUpdate(
            req.params.id,
           { $set: req.body},
           {new: true}
        )
        res.status(200).json(updatedWithdraw)
    }catch(err){
        next(err)
    }
}


// DELETE
export const deleteWithdraw = async (req,res,next) =>{
    try{
        await Withdraw.findByIdAndDelete(
            req.params.id
        )
        res.status(200).json('Withdraw has been deleted')
    }catch(err){
        next(err)
    }
}

// GET
export const getWithdraw = async (req,res,next) =>{
    try{
        const getWithdraw = await Withdraw.findById({_id: req.params.id})
            res.status(200).json(getWithdraw)
    }catch(err){
        next(err)
    }
}

// GET User Withdraws
export const getUserWithdraw = async (req,res,next) =>{
    try{
        const getWithdraw = await Withdraw.find({user_id: req.params.userId})
            res.status(200).json(getWithdraw)
    }catch(err){
        next(err)
    }
}

// GET ALL
export const getAllWithdraws = async (req,res,next) =>{

    try{
        const getWithdraws = await Withdraw.find()
        res.status(200).json(getWithdraws)
    }catch(err){
        next(err)
    }
}