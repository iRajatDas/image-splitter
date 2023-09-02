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

async function sliceImage(imagePath: string): Promise<string[]> {
  try {
    let image: Jimp;

    if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
      const imageBuffer = await downloadImage(imagePath);
      image = await Jimp.read(imageBuffer);
    } else {
      image = await Jimp.read(imagePath);
    }

    const width = image.getWidth();
    const height = image.getHeight();

    if (width === height || width !== 1856 || height !== 2464) {
      console.log(
        `Skipping ${path.basename(imagePath)} due to incorrect dimensions. ❌`
      );
      return [];
    }
    const sliceWidth = Math.floor(width / 2);
    const sliceHeight = Math.floor(height / 2);

    if (sliceWidth <= 0 || sliceHeight <= 0) {
      throw new Error("Invalid image dimensions");
    }

    const outputRootFolder = "./output"; // Specify the root output folder path
    const originalImageName = path.basename(imagePath, path.extname(imagePath));

    const slices: string[] = [];
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const slice = image
          .clone()
          .crop(i * sliceWidth, j * sliceHeight, sliceWidth, sliceHeight);

        const variantFolder = `variant_${i}_${j}`;
        const variantFolderPath = path.join(outputRootFolder, variantFolder);
        const sliceFilename = `${originalImageName}.png`;
        const sliceFilePath = path.join(variantFolderPath, sliceFilename);

        await mkdir(variantFolderPath, { recursive: true });

        await slice.writeAsync(sliceFilePath);
        slices.push(sliceFilePath);
      }
    }

    console.log("Image slices saved to the output folders.");
    return slices;
  } catch (error) {
    throw new Error(`Image slicing failed: ${error}`);
  }
}

async function processImages() {
  try {
    const promises: Promise<string[]>[] = [];

    for (const imagePath of remotePaths) {
      promises.push(sliceImage(imagePath));
    }

    const slicesArrays = await Promise.all(promises);

    for (const slices of slicesArrays) {
      if (slices.length > 0) {
        console.log(
          `Generate ${slices.length} variants:`,
          path.basename(slices[0]),
          "✅"
        );
      }
    }
  } catch (err) {
    console.error("Error:", err);
  }
}

processImages();
