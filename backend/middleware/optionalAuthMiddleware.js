const auth=require('./authMiddleware');
module.exports=(req,res,next)=>{
  // An explicit shop address is public; never use a signed-in owner's tenant for it.
  if(req.query.shop||!req.headers.authorization) return next();
  return auth(req,res,next);
};
