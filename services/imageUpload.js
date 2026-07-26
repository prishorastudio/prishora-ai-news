const { v2: cloudinary } = require("cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadImage(featuredImage) {
  const result = await cloudinary.uploader.upload(
    featuredImage.filePath,
    {
      folder: "prishora-ai-news",
      resource_type: "image",
    }
  );

  return {
    imageUrl: result.secure_url,
    publicId: result.public_id,
  };
}

module.exports = {
  uploadImage,
};