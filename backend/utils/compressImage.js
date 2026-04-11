import heicConvert from "heic-convert";
import sharp from "sharp";

export const convertHeicImage = async (imageBuffer) => {
  return await heicConvert({
    buffer: imageBuffer,
    format: "JPEG",
    quality: 1,
  });
};

export const getCompressedImageBuffer = async (imageBuffer) => {
  let bufferToProcess = imageBuffer;

  const isHeic = bufferToProcess.slice(4, 12).toString().includes("ftypheic");

  if (isHeic) bufferToProcess = await convertHeicImage(imageBuffer);

  const final = await sharp(bufferToProcess)
    .resize({ width: 256 })
    .jpeg({ quality: 85 })
    .toBuffer();
  return final;
};

export const getThumbnailBuffer = async (imageBuffer) => {
	let bufferToProcess = imageBuffer;

	const isHeic = bufferToProcess.slice(4, 12).toString().includes("ftypheic");

	if (isHeic) bufferToProcess = await convertHeicImage(imageBuffer);

	const buffer = await sharp(bufferToProcess)
		.resize({ width: 300, height: 300, fit: 'cover' })
		.jpeg({ quality: 60 })
		.toBuffer();

	return buffer;
};