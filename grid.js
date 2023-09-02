"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const jimp_1 = __importDefault(require("jimp"));
const axios_1 = __importDefault(require("axios"));
const path_1 = __importDefault(require("path"));
const utils_1 = require("./utils");
function downloadImage(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield axios_1.default.get(url, {
            responseType: "arraybuffer",
        });
        return Buffer.from(response.data, "binary");
    });
}
function getImage(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        let image;
        if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
            const imageBuffer = yield downloadImage(imagePath);
            image = yield jimp_1.default.read(imageBuffer);
        }
        else {
            image = yield jimp_1.default.read(imagePath);
        }
        return image;
    });
}
function processAndSaveSlice(image, outputRootFolder, originalImageName, i, j) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const variantFolderPath = path_1.default.join(outputRootFolder, variantFolder);
        const sliceFilename = `${originalImageName}.png`;
        const sliceFilePath = path_1.default.join(variantFolderPath, sliceFilename);
        // Create the variant folder if it doesn't exist
        yield (0, promises_1.mkdir)(variantFolderPath, { recursive: true });
        // Save the slice image inside the variant folder
        yield slice.writeAsync(sliceFilePath);
        return sliceFilePath;
    });
}
function sliceImage(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const outputRootFolder = "./output"; // Specify the root output folder path
            const originalImageName = path_1.default.basename(imagePath, path_1.default.extname(imagePath));
            const image = yield getImage(imagePath);
            if (image.getWidth() !== 1856 ||
                image.getHeight() !== 2464 ||
                image.getHeight() === image.getWidth()) {
                console.log(`Skipping ${path_1.default.basename(imagePath)} due to incorrect dimensions.`);
                return [];
            }
            const slicesPromises = [];
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    slicesPromises.push(processAndSaveSlice(image, outputRootFolder, originalImageName, i, j));
                }
            }
            const slices = yield Promise.all(slicesPromises);
            console.log("Image slices saved to the output folders.");
            return slices;
        }
        catch (error) {
            throw new Error(`Image slicing failed: ${error}`);
        }
    });
}
// Example usage with multiple remote image URLs in parallel
Promise.race(utils_1.remotePaths.map(sliceImage))
    .then((results) => {
    for (const slices of results) {
        console.log("Image slices:");
        console.log(slices);
    }
})
    .catch((err) => {
    console.error("Error:", err);
});
