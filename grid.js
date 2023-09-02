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
            const sliceWidth = Math.floor(width / 2);
            const sliceHeight = Math.floor(height / 2);
            console.log("Image Dimensions:", width, "x", height);
            console.log("Slice Dimensions:", sliceWidth, "x", sliceHeight);
            if (sliceWidth <= 0 || sliceHeight <= 0) {
                throw new Error("Invalid image dimensions");
            }
            const slices = [];
            // Save original image for verification
            yield image.writeAsync("./original.jpg");
            // Generate and save each image slice
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    const slice = image
                        .clone()
                        .crop(i * sliceWidth, j * sliceHeight, sliceWidth, sliceHeight);
                    const sliceFilename = `slice_${i}_${j}.jpg`;
                    yield slice.writeAsync(sliceFilename);
                    slices.push(sliceFilename);
                }
            }
            const jsonData = JSON.stringify(slices);
            yield (0, promises_1.writeFile)("slices.json", jsonData);
            console.log("Image slices saved to slices.json");
            return slices;
        }
        catch (error) {
            throw new Error(`Image slicing failed: ${error}`);
        }
    });
}
// Example usage with a remote image URL
const remoteImagePath = "merise_macmerise_vector_t-shirt_art_ready_for_print_colorful_gr_8e49bc34-e098-45eb-92c3-a23e90561e51.png";
sliceImage(remoteImagePath)
    .then((slices) => {
    console.log("Image slices:");
    console.log(slices);
})
    .catch((err) => {
    console.error("Error:", err);
});
