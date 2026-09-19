/**
 * ==========================================================
 *
 * Handles file uploads throughout LeadFlow AI.
 *
 * Supports
 * ----------------------------------------------------------
 * ✓ Images
 * ✓ PDFs
 * ✓ Word Documents
 * ✓ Excel Files
 * ✓ Videos
 * ✓ Audio
 * ✓ Voice Notes
 *
 * Used By
 * ----------------------------------------------------------
 * AttachmentController
 * MessageController
 * LeadController
 *
 * ==========================================================
 */

import multer from "multer";
import path from "path";
import fs from "fs";

/* ==========================================================
   CREATE UPLOAD DIRECTORY
========================================================== */

const uploadDirectory = "uploads";

if (!fs.existsSync(uploadDirectory)) {

  fs.mkdirSync(uploadDirectory, {

    recursive: true,

  });

}

/* ==========================================================
   STORAGE
========================================================== */

const storage = multer.diskStorage({

  destination: (req, file, callback) => {

    callback(null, uploadDirectory);

  },

  filename: (req, file, callback) => {

    const uniqueName =

      Date.now() +

      "-" +

      Math.round(Math.random() * 1e9);

    callback(

      null,

      uniqueName +

      path.extname(file.originalname)

    );

  },

});

/* ==========================================================
   ALLOWED MIME TYPES
========================================================== */

const allowedMimeTypes = [

  /* Images */

  "image/jpeg",

  "image/png",

  "image/webp",

  "image/gif",

  /* Documents */

  "application/pdf",

  "application/msword",

  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  "application/vnd.ms-excel",

  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",

  /* Audio */

  "audio/mpeg",

  "audio/mp3",

  "audio/wav",

  "audio/webm",

  "audio/ogg",

  /* Video */

  "video/mp4",

  "video/webm",

];

/* ==========================================================
   FILE FILTER
========================================================== */

const fileFilter = (

  req,

  file,

  callback

) => {

  if (

    allowedMimeTypes.includes(

      file.mimetype

    )

  ) {

    callback(

      null,

      true

    );

  }

  else {

    callback(

      new Error(

        "Unsupported file type."

      ),

      false

    );

  }

};

/* ==========================================================
   MULTER INSTANCE
========================================================== */

const upload = multer({

  storage,

  fileFilter,

  limits: {

    fileSize:

      20 * 1024 * 1024,

  },

});

/* ==========================================================
   EXPORTS
========================================================== */

export default upload;