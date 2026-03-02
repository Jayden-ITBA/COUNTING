/**
 * Cloudinary Media Upload Service
 * Handles uploading images and videos to Cloudinary using unsigned presets.
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadMedia = async (file) => {
    if (!file) return null;

    // Validation: Size < 25MB as per BR-06
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
        throw new Error('File size exceeds 25MB limit.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`,
            {
                method: 'POST',
                body: formData,
            }
        );

        if (!response.ok) {
            throw new Error('Failed to upload media to Cloudinary');
        }

        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary Upload Error:', error);
        throw error;
    }
};
