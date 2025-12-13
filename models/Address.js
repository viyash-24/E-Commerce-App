import mongoose from "mongoose";

const addressSchema =new mongoose.Schema({
          userId:{type:string,required:true},
          fullName:{type:string,required:true},
          phoneNumber:{type:string,required:true},
          pincode:{type: Number,required:true},
          area:{type:string,required:true},
          city:{type:string,required:true},
          state:{type:string,required:true},

})

const Address =mongoose.models.address || mongoose.model('address',addressSchema)

export default Address