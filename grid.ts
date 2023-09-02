import { writeFile, mkdir } from "fs/promises";
import Jimp from "jimp";
import axios from "axios";
import path from "path";

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
    const sliceWidth = Math.floor(width / 2);
    const sliceHeight = Math.floor(height / 2);

    console.log("Image Dimensions:", width, "x", height);
    console.log("Slice Dimensions:", sliceWidth, "x", sliceHeight);

    if (sliceWidth <= 0 || sliceHeight <= 0) {
      throw new Error("Invalid image dimensions");
    }

    const outputRootFolder = "./output"; // Specify the root output folder path
    const originalImageName = path.basename(imagePath, path.extname(imagePath));

    // Generate and save each image slice
    const slices: string[] = [];
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const slice = image
          .clone()
          .crop(i * sliceWidth, j * sliceHeight, sliceWidth, sliceHeight);

        const variantFolder = `variant_${i}_${j}`;
        const variantFolderPath = path.join(outputRootFolder, variantFolder);
        const sliceFilename = `sliced_${i}_${j}_${originalImageName}.jpg`;
        const sliceFilePath = path.join(variantFolderPath, sliceFilename);

        // Create the variant folder if it doesn't exist
        await mkdir(variantFolderPath, { recursive: true });

        // Save the slice image inside the variant folder
        await slice.writeAsync(sliceFilePath);
        slices.push(sliceFilePath);
      }
    }

    const jsonData = JSON.stringify(slices);

    await writeFile(path.join(outputRootFolder, "slices.json"), jsonData);
    console.log("Image slices saved to the output folders.");
    return slices;
  } catch (error) {
    throw new Error(`Image slicing failed: ${error}`);
  }
}

// Example usage with a remote image URL
const remoteImagePath =
  "https://media.discordapp.net/attachments/1120340802879631400/1136593116028219483/merise_macmerise_Electric_blue_octopus_strumming_a_guitar_on_a__14c515cc-9e82-4ce9-b488-53959dafa4ca.png";

sliceImage(remoteImagePath)
  .then((slices) => {
    console.log("Image slices:");
    console.log(slices);
  })
  .catch((err) => {
    console.error("Error:", err);
  });
