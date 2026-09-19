/**
 * ==========================================================
 *
 * File:
 *
 * leadFlowAiBackend/middleware/uploadPropertyImages.js
 *
 * Actual upload directory:
 *
 * C:\MERN\leadFlow AI\leadFlowAiBackend\uploads\properties
 *
 * Browser URL:
 *
 * http://localhost:5000/uploads/properties/<filename>
 *
 * ==========================================================
 *
 * RESPONSIBILITIES
 * ----------------------------------------------------------
 *
 * • Upload property cover image
 * • Upload property gallery images
 * • Upload one generic property image
 * • Upload cover + gallery images together
 * • Generate unique filenames
 * • Validate image MIME types
 * • Enforce file-size limits
 * • Enforce maximum number of files
 *
 * ==========================================================
 */

import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";


/* ==========================================================
   CURRENT FILE LOCATION
========================================================== */

const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);


/* ==========================================================
   ABSOLUTE PROPERTY UPLOAD DIRECTORY
========================================================== */

/**
 * Current file:
 *
 * leadFlowAiBackend/middleware/uploadPropertyImages.js
 *
 * __dirname:
 *
 * leadFlowAiBackend/middleware
 *
 * ../uploads/properties:
 *
 * leadFlowAiBackend/uploads/properties
 */

export const uploadDirectory = path.resolve(
  __dirname,
  "../uploads/properties"
);


/* ==========================================================
   CREATE DIRECTORY IF NEEDED
========================================================== */

try {
  if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, {
      recursive: true,
    });
  }
} catch (error) {
  console.error(
    "=================================================="
  );

  console.error(
    "❌ PROPERTY IMAGE DIRECTORY CREATION FAILED"
  );

  console.error(
    error
  );

  console.error(
    "Upload directory:",
    uploadDirectory
  );

  console.error(
    "=================================================="
  );

  throw error;
}


/* ==========================================================
   DIRECTORY DEBUG
========================================================== */

console.log(
  "=================================================="
);

console.log(
  "📁 PROPERTY IMAGE UPLOAD DIRECTORY:"
);

console.log(
  uploadDirectory
);

console.log(
  "📂 DIRECTORY EXISTS:",
  fs.existsSync(uploadDirectory)
);

console.log(
  "=================================================="
);


/* ==========================================================
   MULTER STORAGE
========================================================== */

const storage = multer.diskStorage({

  /* --------------------------------------------------------
     DESTINATION
  -------------------------------------------------------- */

  destination(req, file, cb) {

    cb(
      null,
      uploadDirectory
    );
  },


  /* --------------------------------------------------------
     FILENAME
  -------------------------------------------------------- */

  filename(req, file, cb) {

    const extension = path
      .extname(
        file.originalname
      )
      .toLowerCase();


    /**
     * Timestamp + random number.
     *
     * Every upload receives a NEW filename.
     *
     * Example:
     *
     * 1787928505786-111111111.jpg
     * 1787928509000-222222222.jpg
     */

    const uniqueName =
      `${Date.now()}-${Math.floor(
        Math.random() * 1000000000
      )}${extension}`;


    console.log(
      "=================================================="
    );

    console.log(
      "🖼️ NEW PROPERTY IMAGE"
    );

    console.log(
      "Original filename:",
      file.originalname
    );

    console.log(
      "Generated filename:",
      uniqueName
    );

    console.log(
      "Field name:",
      file.fieldname
    );

    console.log(
      "MIME type:",
      file.mimetype
    );

    console.log(
      "Destination:",
      uploadDirectory
    );

    console.log(
      "=================================================="
    );


    cb(
      null,
      uniqueName
    );
  },

});


/* ==========================================================
   ALLOWED MIME TYPES
========================================================== */

const allowedTypes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);


/* ==========================================================
   FILE FILTER
========================================================== */

const fileFilter = (
  req,
  file,
  cb
) => {

  if (
    allowedTypes.has(
      file.mimetype
    )
  ) {

    cb(
      null,
      true
    );

    return;
  }


  cb(
    new Error(
      "Only JPG, JPEG, PNG and WEBP images are allowed."
    ),
    false
  );
};


/* ==========================================================
   MULTER INSTANCE
========================================================== */

const upload = multer({

  storage,

  fileFilter,

  limits: {

    /**
     * Maximum 10 MB per file.
     */

    fileSize:
      10 * 1024 * 1024,


    /**
     * Maximum 20 files in a request.
     */

    files:
      20,

  },

});


/* ==========================================================
   COVER IMAGE
========================================================== */

/**
 * FormData field:
 *
 * coverImage
 *
 * Result:
 *
 * req.file
 */

export const uploadCoverImage =
  upload.single(
    "coverImage"
  );


/* ==========================================================
   GENERIC SINGLE IMAGE
========================================================== */

/**
 * FormData field:
 *
 * image
 *
 * Result:
 *
 * req.file
 */

export const uploadPropertyImage =
  upload.single(
    "image"
  );


/* ==========================================================
   MULTIPLE GALLERY IMAGES
========================================================== */

/**
 * FormData field:
 *
 * images
 *
 * Result:
 *
 * req.files
 */

export const uploadPropertyImages =
  upload.array(
    "images",
    20
  );


/* ==========================================================
   COVER + GALLERY IMAGES
========================================================== */

/**
 * Supports:
 *
 * coverImage -> maximum 1
 *
 * images -> maximum 20
 *
 * Result:
 *
 * req.files.coverImage[]
 * req.files.images[]
 */

export const uploadPropertyMedia =
  upload.fields([

    {
      name:
        "coverImage",

      maxCount:
        1,
    },

    {
      name:
        "images",

      maxCount:
        20,
    },

  ]);


/* ==========================================================
   DEFAULT EXPORT
========================================================== */

export default uploadPropertyImages;