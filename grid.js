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
function sliceImage(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let image;
            if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
                const imageBuffer = yield downloadImage(imagePath);
                image = yield jimp_1.default.read(imageBuffer);
            }
            else {
                image = yield jimp_1.default.read(imagePath);
            }
            const width = image.getWidth();
            const height = image.getHeight();
            if (width === height || width !== 1856 || height !== 2464) {
                console.log(`Skipping ${path_1.default.basename(imagePath)} due to incorrect dimensions. ❌`);
                return [];
            }
            const sliceWidth = Math.floor(width / 2);
            const sliceHeight = Math.floor(height / 2);
            if (sliceWidth <= 0 || sliceHeight <= 0) {
                throw new Error("Invalid image dimensions");
            }
            const outputRootFolder = "./output"; // Specify the root output folder path
            const originalImageName = path_1.default.basename(imagePath, path_1.default.extname(imagePath));
            const slices = [];
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    const slice = image
                        .clone()
                        .crop(i * sliceWidth, j * sliceHeight, sliceWidth, sliceHeight);
                    const variantFolder = `variant_${i}_${j}`;
                    const variantFolderPath = path_1.default.join(outputRootFolder, variantFolder);
                    const sliceFilename = `sliced_${i}_${j}_${originalImageName}.jpg`;
                    const sliceFilePath = path_1.default.join(variantFolderPath, sliceFilename);
                    yield (0, promises_1.mkdir)(variantFolderPath, { recursive: true });
                    yield slice.writeAsync(sliceFilePath);
                    slices.push(sliceFilePath);
                }
            }
            console.log("Image slices saved to the output folders.");
            return slices;
        }
        catch (error) {
            throw new Error(`Image slicing failed: ${error}`);
        }
    });
}
function processImages() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const promises = [];
            for (const imagePath of utils_1.remotePaths) {
                promises.push(sliceImage(imagePath));
            }
            const slicesArrays = yield Promise.all(promises);
            for (const slices of slicesArrays) {
                if (slices.length > 0) {
                    console.log(`Generate ${slices.length} variants:`, path_1.default.basename(slices[0]), "✅");
                }
            }
        }
        catch (err) {
            console.error("Error:", err);
        }
    });
}
processImages();
