// import mongoose from "mongoose";
// import bcrypt from 'bcrypt';
// const userSchema=new mongoose.Schema({
//     userName:{type:String, required:true, unique:true},
//     password:{type:String},
//     firstName:{
//         type:String
//     },
//     lastName:{
//         type:String
//     },
//     googleId:{
//         type:String
//     },
//     picture: { 
//         type: String
//     },
//     googleAuth: {
//         accessToken: String,
//         refreshToken: String,
//         expiryDate: Date
//     },
// },{timestamps:true});

// userSchema.pre('save', async function (next) {
//     if (this.isModified('password')) {
//         this.password = await bcrypt.hash(this.password, 10);
//     }
//     next();
// });

// const Users=mongoose.model("Users",userSchema);

// export default Users;