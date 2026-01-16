import { API_BASE_URL } from "./constants";

export const getImageUrl = (path: string) => {
    if (!path) return "";
    if (path.startsWith("http") || path.startsWith("data:")) return path;

    // Ensure path starts with /
    const cleanPath = path.startsWith("/") ? path : `/${path}`;

    // Use S3 Bucket
    return `https://fiwfan-bucket.s3.ap-southeast-1.amazonaws.com${cleanPath}`;
};
