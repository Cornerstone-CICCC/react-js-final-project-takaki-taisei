import { v2 as cloudinary } from "cloudinary";

// Cloudinary automatically reads CLOUDINARY_URL from process.env.
// We only set secure: true so generated URLs use https.
cloudinary.config({ secure: true });

export { cloudinary };
