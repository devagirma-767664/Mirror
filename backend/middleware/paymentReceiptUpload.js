const multer=require('multer');

const upload=multer({
  storage:multer.memoryStorage(),
  limits:{fileSize:5*1024*1024,files:1},
  fileFilter:(req,file,cb)=>{
    if(['image/jpeg','image/png','image/webp'].includes(file.mimetype)) return cb(null,true);
    cb(new Error('Attach a PNG, JPG, or WEBP receipt screenshot.'));
  },
});

module.exports=(req,res,next)=>upload.single('receipt')(req,res,error=>{
  if(error) return res.status(400).json({error:error.code==='LIMIT_FILE_SIZE'?'Receipt screenshot must be 5 MB or smaller.':error.message});
  next();
});
