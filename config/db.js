import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.url;



async function connectToDB(){

    try {
        await  mongoose.connect(url);
        console.log("connected");
        
    } catch (error) {
        console.error('Error connecting to Database',error);
        process.exit(1); 

    }
};

export default connectToDB;