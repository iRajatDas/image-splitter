import { writeFile } from "fs/promises";
import Jimp from "jimp";
import axios from "axios";

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

    const slices: string[] = [];

    // Save original image for verification
    await image.writeAsync("./original.jpg");

    // Generate and save each image slice
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const slice = image
          .clone()
          .crop(i * sliceWidth, j * sliceHeight, sliceWidth, sliceHeight);

        const sliceFilename = `slice_${i}_${j}.jpg`;
        await slice.writeAsync(sliceFilename);
        slices.push(sliceFilename);
      }
    }

    const jsonData = JSON.stringify(slices);

    await writeFile("slices.json", jsonData);
    console.log("Image slices saved to slices.json");
    return slices;
  } catch (error) {
    throw new Error(`Image slicing failed: ${error}`);
  }
}

// Example usage with a remote image URL
const remoteImagePath =
  "merise_macmerise_vector_t-shirt_art_ready_for_print_colorful_gr_8e49bc34-e098-45eb-92c3-a23e90561e51.png";

sliceImage(remoteImagePath)
  .then((slices) => {
    console.log("Image slices:");
    console.log(slices);
  })
  .catch((err) => {
    console.error("Error:", err);
  });
