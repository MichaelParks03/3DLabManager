import { supabase } from "./supabase";

/**
 * Upload a file to Supabase Storage
 * @param {File} file - The file to upload
 * @param {string} bucket - Storage bucket name (e.g., 'lab-models', 'lab-thumbnails')
 * @param {string} folder - Optional folder path within bucket
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadFile(file, bucket, folder = '') {
  try {
    // Generate unique filename to avoid conflicts
    const timestamp = Date.now();
    const _fileExt = file.name.split('.').pop(); // Reserved for future use
    const fileName = `${timestamp}_${file.name}`;
    const filePath = folder ? `${folder}/${fileName}` : fileName;

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return {
      success: true,
      url: urlData.publicUrl,
      path: data.path
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a file from Supabase Storage
 * @param {string} bucket - Storage bucket name
 * @param {string} filePath - Path to file in bucket
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFile(bucket, filePath) {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Upload lab 3D model file (.glb)
 * @param {File} file - GLB file to upload
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadLabModel(file) {
  // Validate file type
  if (!file.name.toLowerCase().endsWith('.glb')) {
    return { success: false, error: 'Only .glb files are allowed for lab models' };
  }

  // Validate file size (max 10MB based on 25GB total server storage)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      success: false,
      error: `File size (${fileSizeMB} MB) exceeds the maximum limit of 10 MB. Please compress your model or choose a smaller file.`
    };
  }

  return uploadFile(file, 'lab-models', 'models');
}

/**
 * Upload lab thumbnail image
 * @param {File} file - Image file to upload
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadLabThumbnail(file) {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { success: false, error: 'Only JPG, PNG, and WebP images are allowed' };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { success: false, error: 'Image size must be less than 5MB' };
  }

  return uploadFile(file, 'lab-thumbnails', 'thumbnails');
}

/**
 * Upload equipment 3D model file (.glb)
 * @param {File} file - GLB file to upload
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadItemModel(file) {
  if (!file.name.toLowerCase().endsWith('.glb')) {
    return { success: false, error: 'Only .glb files are allowed for item models' };
  }

  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
    return {
      success: false,
      error: `File size (${fileSizeMB} MB) exceeds the maximum limit of 10 MB.`
    };
  }

  return uploadFile(file, 'lab-models', 'item-models');
}

/**
 * Upload equipment thumbnail image
 * @param {File} file - Image file to upload
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadEquipmentThumbnail(file) {
  // Validate file type
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    return { success: false, error: 'Only JPG, PNG, and WebP images are allowed' };
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { success: false, error: 'Image size must be less than 5MB' };
  }

  return uploadFile(file, 'lab-thumbnails', 'items');
}
