
import { GoogleGenAI, Modality, Part } from "@google/genai";
import { UploadedImage } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const textModel = 'gemini-2.5-flash';
const imageModel = 'gemini-2.5-flash-image';

const fileToGenerativePart = (base64: string, mimeType: string) => {
    return {
        inlineData: {
            data: base64.split(",")[1],
            mimeType,
        },
    };
};

export const suggestPrompt = async (): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: 'Suggest a short, creative, and fun prompt for an AI to edit a photo. For example: "Make it look like a vintage photograph from the 1970s", or "Add a majestic unicorn in the background".',
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error suggesting prompt:", error);
        throw new Error("Gợi ý prompt thất bại. Vui lòng thử lại.");
    }
};

export const describeImage = async (image: UploadedImage): Promise<string> => {
    try {
        const imagePart = fileToGenerativePart(image.base64, image.file.type);
        const response = await ai.models.generateContent({
            model: imageModel,
            contents: { parts: [{ text: "Describe this image in detail." }, imagePart] },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error describing image:", error);
        throw new Error("Lấy mô tả ảnh thất bại. Vui lòng thử lại.");
    }
};

export const suggestPromptFromImage = async (image: UploadedImage): Promise<string> => {
    try {
        const imagePart = fileToGenerativePart(image.base64, image.file.type);
        const response = await ai.models.generateContent({
            model: imageModel,
            contents: { parts: [{ text: "Based on this image, suggest a short, creative prompt to apply a similar style or elements to another image." }, imagePart] },
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error suggesting prompt from image:", error);
        throw new Error("Gợi ý prompt từ ảnh thất bại. Vui lòng thử lại.");
    }
}

interface EditImageParams {
    primaryImage: UploadedImage;
    prompt: string;
    detailedDescription?: string;
    referenceImage?: UploadedImage;
}

export const editImage = async ({
    primaryImage,
    prompt,
    detailedDescription,
    referenceImage,
}: EditImageParams): Promise<string> => {
    try {
        const parts: Part[] = [];

        parts.push(fileToGenerativePart(primaryImage.base64, primaryImage.file.type));

        if (referenceImage) {
            parts.push(fileToGenerativePart(referenceImage.base64, referenceImage.file.type));
        }

        let fullPrompt = prompt;
        if (detailedDescription) {
            fullPrompt += `\n\nDetailed instructions: ${detailedDescription}`;
        }

        if (referenceImage) {
            fullPrompt = `Using the second image as a style and content reference, apply the following edit to the first image: "${fullPrompt}"`;
        }

        parts.push({ text: fullPrompt });
        
        const response = await ai.models.generateContent({
            model: imageModel,
            contents: { parts },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:${part.inlineData.mimeType};base64,${base64ImageBytes}`;
            }
        }
        
        throw new Error("AI không trả về ảnh. Hãy thử một prompt khác.");
    } catch (error) {
        console.error("Error editing image:", error);
        if (error instanceof Error) {
            throw new Error(`Tạo ảnh thất bại: ${error.message}`);
        }
        throw new Error("Đã xảy ra lỗi không xác định trong quá trình tạo ảnh.");
    }
};
