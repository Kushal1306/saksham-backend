import express from 'express';
// import TestRouter from './TestRoute.js';
import feedbackRoutes from './feedbackRoutes.js';
import sakshamRouter from './Saksham.js';

const mainRouter=express.Router();

// mainRouter.use("/user",UserRouter);

mainRouter.use("/feedback",feedbackRoutes);

// mainRouter.use("/test",TestRouter);
mainRouter.use("/saksham",sakshamRouter);


export default mainRouter;