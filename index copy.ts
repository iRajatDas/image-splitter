import { writeFile } from "fs";
import Jimp from "jimp";

async function sliceImage(imagePath: string): Promise<string[]> {
  try {
    const image = await Jimp.read(imagePath);

    const width = image.getWidth();
    const height = image.getHeight();
    const sliceWidth = Math.floor(width / 2);
    const sliceHeight = Math.floor(height / 2);

    console.log("Image Dimensions:", width, "x", height);
    console.log("Slice Dimensions:", sliceWidth, "x", sliceHeight);

    if (sliceWidth <= 0 || sliceHeight <= 0) {
      throw new Error("Invalid image dimensions");
    }

    const slices: string[] = [];

    // Save original image for verification
    await image.writeAsync("./original.jpg");

    // Generate and save each image slice
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const slice = image
          .clone()
          .crop(i * sliceWidth, j * sliceHeight, sliceWidth, sliceHeight)
          .getBase64Async(Jimp.MIME_JPEG);

        slices.push(await slice);
      }
    }

    const jsonData = JSON.stringify(slices);

    writeFile("slices.json", jsonData, (e) => console.log(e));
    console.log("Image slices saved to slices.json");
    return slices;
  } catch (error) {
    throw new Error(`Image slicing failed: ${error}`);
  }
}

// Example usage
const imagePath = "./grid.png";

sliceImage(imagePath)
  .then((slices) => {
    console.log("Image slices:");
    console.log(slices);
  })
  .catch((err) => {
    console.error("Error:", err);
  });
