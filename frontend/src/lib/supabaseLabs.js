import { supabase } from "./supabase";

/**
 * Get all labs
 * @returns {Promise<Array>} Array of lab objects
 */
export async function getLabs() {
  const { data, error } = await supabase.from("labs").select("*").order("name");

  if (error) throw error;

  // Map database fields to frontend-friendly names
  return data.map((lab) => ({
    id: lab.id,
    name: lab.name,
    blurb: lab.blurb,
    modelPath: lab.model_path,
    thumbnailUrl: lab.thumbnail_url,
    createdAt: lab.created_at,
    updatedAt: lab.updated_at,
  }));
}

/**
 * Get a single lab by ID
 * @param {string} id - Lab ID (e.g., "erb_202")
 * @returns {Promise<Object>} Lab object
 */
export async function getLabById(id) {
  const { data, error } = await supabase
    .from("labs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  // Map to frontend structure
  return {
    id: data.id,
    lab_code: data.lab_code,
    name: data.name,
    blurb: data.blurb,
    modelPath: data.model_path,
    thumbnailUrl: data.thumbnail_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Create a new lab
 * @param {Object} labData - Lab data
 * @param {string} labData.id - Lab ID
 * @param {string} labData.name - Lab name
 * @param {string} labData.blurb - Lab description
 * @param {string} labData.modelPath - Path to 3D model file
 * @param {string} labData.thumbnailUrl - Path to thumbnail image
 * @returns {Promise<Object>} Created lab object
 */
export async function createLab({ id, name, blurb, modelPath, thumbnailUrl }) {
  const { data, error } = await supabase
    .from("labs")
    .insert([
      {
        id,
        name,
        blurb,
        model_path: modelPath,
        thumbnail_url: thumbnailUrl,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // Map to frontend structure
  return {
    id: data.id,
    name: data.name,
    blurb: data.blurb,
    modelPath: data.model_path,
    thumbnailUrl: data.thumbnail_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Update an existing lab
 * @param {string} id - Lab ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated lab object
 */
export async function updateLab(id, updates) {
  const dbUpdates = {};

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.blurb !== undefined) dbUpdates.blurb = updates.blurb;
  if (updates.modelPath !== undefined) dbUpdates.model_path = updates.modelPath;
  if (updates.thumbnailUrl !== undefined)
    dbUpdates.thumbnail_url = updates.thumbnailUrl;

  const { data, error } = await supabase
    .from("labs")
    .update(dbUpdates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Map to frontend structure
  return {
    id: data.id,
    name: data.name,
    blurb: data.blurb,
    modelPath: data.model_path,
    thumbnailUrl: data.thumbnail_url,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

/**
 * Delete a lab
 * @param {string} id - Lab ID
 * @returns {Promise<void>}
 */
export async function deleteLab(id) {
  const { error } = await supabase.from("labs").delete().eq("id", id);

  if (error) throw error;
}
