/**
 * @typedef {Object} Item
 * @property {string} id - Primary id (also QR payload)
 * @property {string} name - Equipment name (e.g., "Prusa MK3S")
 * @property {'Printer'|'Tool'|'Material'|'Electronics'|'Safety'|'Other'} category - Item category
 * @property {'available'|'checked_out'|'broken'} status - Current status
 * @property {string} locationPath - Location path (e.g., "Senior Lab › North Bench")
 * @property {string} [thumbnailUrl] - Optional placeholder image URL
 * @property {string} [amazonLink] - Optional Amazon product URL
 * @property {string} [modelPath] - Optional 3D model path (e.g., "/models/items/drone.glb")
 * @property {number} [scale] - Optional scale factor for 3D rendering (default: 1.0)
 * @property {string} [labId] - Optional lab ID this item belongs to (e.g., "erb_202")
 * @property {number} [x] - Optional X coordinate in 3D space
 * @property {number} [y] - Optional Y coordinate in 3D space
 * @property {number} [z] - Optional Z coordinate in 3D space
 * @property {[number, number, number]} [hotspot] - Optional 3D focus point coordinates (deprecated, use x/y/z)
 */

/**
 * @typedef {Object} Lab
 * @property {string} id - Lab ID (e.g., "erb_202")
 * @property {string} name - Lab name (e.g., "ERB 202")
 * @property {string} blurb - Lab description
 * @property {string} modelPath - Path to 3D model file (e.g., "/models/no_origin_202.glb")
 * @property {string} thumbnailUrl - Path to thumbnail image (e.g., "/images/erb_202.png")
 * @property {string} [createdAt] - Creation timestamp
 * @property {string} [updatedAt] - Last update timestamp
 */

/**
 * @typedef {Object} Issue
 * @property {string} itemId - ID of the item the issue is about
 * @property {'Clogged'|'Jammed'|'Broken'|'Other'} type - Type of issue
 * @property {string} notes - Additional notes about the issue
 */

/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success - Whether the API call was successful
 * @property {any} [data] - Response data
 * @property {string} [error] - Error message if unsuccessful
 */

export const ITEM_CATEGORIES = [
  'Printer',
  'Tool',
  'Material',
  'Electronics',
  'Safety',
  'Computer',
  'VR Headset',
  'Tablet',
  'Phone',
  'Webcam',
  'Network',
  'Lab Equipment',
  'Other'
];

export const ITEM_STATUSES = [
  'available',
  'checked_out',
  'broken'
];

export const ISSUE_TYPES = [
  'Broken',
  'Missing',
  'Damaged',
  'Malfunctioning',
  'Needs Calibration',
  'Needs Cleaning',
  'Low Quality',
  'Other'
];