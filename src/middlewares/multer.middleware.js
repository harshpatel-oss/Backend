import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './public/temp') // Specify the destination directory for uploaded files
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname) // Specify the filename for the uploaded file
    }
});

 export const upload = multer({ 
     storage ,
     });


    //  Multer is Express middleware used to process multipart/form-data and extract uploaded files.
    //  It can temporarily store files on the server using diskStorage().
    //  Cloudinary is a cloud media management service used for permanent storage, optimization,
    //  and delivery of images/videos through URLs. Typically, Multer receives the file from the client 
    // and stores it temporarily in a local folder like public/temp. Then the backend uploads that file to Cloudinary,
    //  receives a public URL, stores that URL in MongoDB, and optionally deletes the temporary local file.
    //  MongoDB generally stores only the URL, not the actual image, which keeps the database lightweight and efficient