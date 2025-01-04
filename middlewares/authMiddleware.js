import jwt from 'jsonwebtoken';

const authMiddleware=(req,res,next)=>{
    const authHeader=req.headers.authorization;
    console.log(authHeader);
    if(!authHeader||!authHeader.startsWith('Bearer')){
        return res.status(402).json({
            message:'Invalid authHeader',
        })
    }
    const token=authHeader.split(' ')[1];
    try {
        
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        if(decoded.userId){
            req.userId=decoded.userId;
            next();
        }
        else{
            return res.status(403).json({
                message:'Invalid Auth Header'
            })
        }
    } catch (error) {
        return res.status(403).json({
            message:'Invalid Auth Header'
        })
    }
};

export default authMiddleware;