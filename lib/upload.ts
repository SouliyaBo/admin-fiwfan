import { API_BASE_URL } from "./constants";
import { compressImage } from "./image";

// Helper to get token (since Admin stores it in localStorage)
const getAuthToken = () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("token");
    }
    return null;
};

export const uploadS3File = async (input: File | React.ChangeEvent<HTMLInputElement> | any, folder: string = "system"): Promise<string> => {
    try {
        const token = getAuthToken();
        if (!token) throw new Error("No authentication token found");

        // 1. Resolve File Object
        let data: File;
        if (input instanceof File) {
            data = input;
        } else if (input?.target?.files?.[0]) {
            data = input.target.files[0];
        } else {
            throw new Error("No file provided");
        }

        // 2. Validate Size (Max 100MB)
        const maxSize = 100 * 1024 * 1024; // 100MB
        if (data.size > maxSize) {
            throw new Error("File size too large. Maximum size is 100MB.");
        }

        // 3. Validate Type
        const allowedTypes = [
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            'video/mp4', 'video/webm', 'video/quicktime'
        ];
        if (!allowedTypes.includes(data.type)) {
            throw new Error("Invalid file type. Allowed: JPEG, PNG, GIF, WebP, MP4, WebM, MOV.");
        }

        // --- NEW: Convert Image to WebP ---
        // Skip for GIF/Video
        if (data.type.startsWith('image/') && data.type !== 'image/gif' && data.type !== 'image/webp') {
            try {
                console.log(`Converting ${data.name} to WebP...`);
                data = await compressImage(data);
                // Update type and name for consistency after conversion
                // Note: compressImage returns a new File object with correct type/name
            } catch (error) {
                console.warn("WebP conversion failed, falling back to original", error);
            }
        }

        // 4. Generate Random Filename
        // Prefix: ADMIN
        let generateName = "";
        let result = "ADMIN";
        const characters = "0123456789";
        const charactersLength = characters.length;
        for (let i = 0; i < 9; i++) {
            generateName = result += characters.charAt(
                Math.floor(Math.random() * charactersLength),
            );
        }

        const parts = data.name.split(".");
        const extension = parts[parts.length - 1];
        const newImageName = `${generateName}.${extension}`;

        console.log(`Requesting presigned URL for: ${newImageName} in folder: ${folder}`);

        // 5. Get Pre-signed URL
        const presignRes = await fetch(`${API_BASE_URL}/files/presign-url`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                fileName: newImageName,
                fileType: data.type,
                folder: folder
            })
        });

        if (!presignRes.ok) {
            throw new Error("Failed to get presigned URL");
        }

        const { uploadUrl, key } = await presignRes.json();
        console.log("Presigned URL received. Uploading to S3...");

        // 6. Upload to S3
        const uploadRes = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                "Content-Type": data.type
            },
            body: data
        });

        if (!uploadRes.ok) {
            throw new Error("Upload to storage failed");
        }

        console.log("Upload completed successfully");
        return key;

    } catch (error: any) {
        console.error("File upload error:", error);
        throw error;
    }
};
