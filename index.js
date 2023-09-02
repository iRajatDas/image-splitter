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
function sliceImage(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const image = yield jimp_1.default.read(imagePath);
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
            // Generate and encode each image slice as base64
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 2; j++) {
                    const slice = image
                        .clone()
                        .crop(i * sliceWidth, j * sliceHeight, sliceWidth, sliceHeight);
                    const base64Data = yield slice.getBase64Async(jimp_1.default.MIME_JPEG);
                    slices.push(base64Data);
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
