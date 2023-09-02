import { writeFile, mkdir } from "fs/promises";
import Jimp from "jimp";
import axios from "axios";
import path from "path";
import { remotePaths } from "./utils";

async function downloadImage(url: string): Promise<Buffer> {
  const response = await axios.get(url, {
    responseType: "arraybuffer",
  });
  return Buffer.from(response.data, "binary");
}

async function getImage(imagePath: string): Promise<Jimp> {
  let image: Jimp;

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    const imageBuffer = await downloadImage(imagePath);
    image = await Jimp.read(imageBuffer);
  } else {
    image = await Jimp.read(imagePath);
  }

  return image;
}

async function processAndSaveSlice(
  image: Jimp,
  outputRootFolder: string,
  originalImageName: string,
  i: number,
  j: number
): Promise<string> {
  const width = image.getWidth();
  const height = image.getHeight();
  const sliceWidth = Math.floor(width / 2);
  const sliceHeight = Math.floor(height / 2);

  if (sliceWidth <= 0 || sliceHeight <= 0) {
    throw new Error("Invalid image dimensions");
  }

  const slice = image
    .clone()
    .crop(i * sliceWidth, j * sliceHeight, sliceWidth, sliceHeight);

  const variantFolder = `variant_${i}_${j}`;
  const variantFolderPath = path.join(outputRootFolder, variantFolder);
  const sliceFilename = `${originalImageName}.png`;
  const sliceFilePath = path.join(variantFolderPath, sliceFilename);

  // Create the variant folder if it doesn't exist
  await mkdir(variantFolderPath, { recursive: true });

  // Save the slice image inside the variant folder
  await slice.writeAsync(sliceFilePath);
  return sliceFilePath;
}

async function sliceImage(imagePath: string): Promise<string[]> {
  try {
    const outputRootFolder = "./output"; // Specify the root output folder path
    const originalImageName = path.basename(imagePath, path.extname(imagePath));

    const image = await getImage(imagePath);

    if (
      image.getWidth() !== 1856 ||
      image.getHeight() !== 2464 ||
      image.getHeight() === image.getWidth()
    ) {
      console.log(
        `Skipping ${path.basename(imagePath)} due to incorrect dimensions.`
      );
      return [];
    }

    const slicesPromises: Promise<string>[] = [];
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        slicesPromises.push(
          processAndSaveSlice(image, outputRootFolder, originalImageName, i, j)
        );
      }
    }

    const slices = await Promise.all(slicesPromises);
    console.log("Image slices saved to the output folders.");
    return slices;
  } catch (error) {
    throw new Error(`Image slicing failed: ${error}`);
  }
}

// Example usage with multiple remote image URLs in parallel
Promise.race(remotePaths.map(sliceImage))
  .then((results) => {
    console.log(`Processing: `, sliceImage);
    for (const slices of results) {
      console.log("Image slices:");
      console.log(slices);
    }
  })
  .catch((err) => {
    console.error("Error:", err);
  });
