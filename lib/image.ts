export const compressImage = async (file: File, quality: number = 0.8): Promise<File> => {
    // Skip if not an image or if it's an animated format (GIF) or SVG
    if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.type === 'image/svg+xml') {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                if (!ctx) {
                    resolve(file); // Fallback: return original if canvas fails
                    return;
                }

                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0, img.width, img.height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file); // Fallback
                            return;
                        }

                        // Create new file with .webp extension
                        const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                        const newFile = new File([blob], newName, {
                            type: "image/webp",
                            lastModified: Date.now(),
                        });

                        resolve(newFile);
                    },
                    "image/webp",
                    quality
                );
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};
