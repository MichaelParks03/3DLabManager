import { supabase } from "./supabase";

/**
 * Get all equipment (with filters)
 * @param {Object} options - Filter options
 * @param {string} options.q - Search query
 * @param {string} options.category - Category filter
 * @param {string} options.status - Status filter
 * @param {string} options.labId - Lab ID filter (optional)
 * @returns {Promise<Array>} Array of equipment items
 */
export async function getEquipment({
  q = "",
  category = "all",
  status = "all",
  labId = null,
} = {}) {
  let query = supabase.from("equipment").select("*");

  if (q) {
    query = query.or(
      `qr_code.ilike.%${q}%,name.ilike.%${q}%,category.ilike.%${q}%,location_path.ilike.%${q}%`,
    );
  }

  if (category !== "all") {
    query = query.eq("category", category);
  }

  if (status !== "all") {
    query = query.eq("status", status);
  }

  if (labId) {
    query = query.eq("lab_id", labId);
  }

  const { data, error } = await query.order("name");

  if (error) throw error;

  //  Map database fields → UI-friendly shape
  return data.map((item) => ({
    id: item.qr_code, // UI expects `id` to be the QR code
    name: item.name,
    category: item.category,
    status: item.status,
    locationPath: item.location_path,
    thumbnailUrl: item.thumbnail_url,
    amazonLink: item.amazon_link,
    modelPath: item.model_path,
    scale: item.scale,
    labId: item.lab_id,
    x: item.x,
    y: item.y,
    z: item.z,
    rotX: item.rot_x,
    rotY: item.rot_y,
    rotZ: item.rot_z,
    serialNumber: item.serial_number,
    assetTag: item.asset_tag,
    brand: item.brand,
    model: item.model,
    metadata: item.metadata || {},
  }));
}

/**
 * Get single equipment by QR code (NOT UUID)
 * @param {string} qrCode - QR code of the equipment
 * @returns {Promise<Object>} Equipment object
 */
export async function getEquipmentById(qrCode) {
  const { data, error } = await supabase
    .from("equipment")
    .select("*")
    .eq("qr_code", qrCode)
    .single();

  if (error) throw error;

  //Map to UI structure
  return {
    id: data.qr_code,
    name: data.name,
    category: data.category,
    status: data.status,
    locationPath: data.location_path,
    thumbnailUrl: data.thumbnail_url,
    amazonLink: data.amazon_link,
    modelPath: data.model_path,
    scale: data.scale,
    labId: data.lab_id,
    x: data.x,
    y: data.y,
    z: data.z,
    serialNumber: data.serial_number,
    assetTag: data.asset_tag,
    brand: data.brand,
    model: data.model,
    metadata: data.metadata || {},
  };
}

export async function getEquipmentByLabId(labId) {
  const { data, error } = await supabase
    .from("equipment")
    .select("*")
    .eq("lab_id", String(labId));

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    qrCode: row.qr_code,
    name: row.name,
    category: row.category,
    status: row.status,
    locationPath: row.location_path,
    thumbnailUrl: row.thumbnail_url,
    amazonLink: row.amazon_link,
    modelPath: row.model_path,
    scale: row.scale,
    labId: row.lab_id,
    x: row.x,
    y: row.y,
    z: row.z,
    rotX: row.rot_x,
    rotY: row.rot_y,
    rotZ: row.rot_z,
    serialNumber: row.serial_number,
    assetTag: row.asset_tag,
    brand: row.brand,
    model: row.model,
    metadata: row.metadata || {},
  }));
}

export async function getEquipmentByLabCode(labCode) {
  const { data, error } = await supabase
    .from("equipment")
    .select("*")
    .eq("lab_id", String(labCode));

  if (error) throw error;

  //Map to UI structure
  return (data || []).map((row) => ({
    id: row.id,
    qrCode: row.qr_code,
    name: row.name,
    category: row.category,
    status: row.status,
    locationPath: row.location_path,
    thumbnailUrl: row.thumbnail_url,
    amazonLink: row.amazon_link,
    modelPath: row.model_path,
    scale: row.scale,
    labId: row.lab_id,
    x: row.x,
    y: row.y,
    z: row.z,
    rotX: row.rot_x,
    rotY: row.rot_y,
    rotZ: row.rot_z,
    serialNumber: row.serial_number,
    assetTag: row.asset_tag,
    brand: row.brand,
    model: row.model,
    metadata: row.metadata || {},
  }));
}

/**
 * Create new equipment item
 * @param {Object} itemData - Equipment data
 * @returns {Promise<Object>} Created equipment object
 */
export async function createEquipment(itemData) {
  const dbData = {
    qr_code: itemData.id,
    name: itemData.name,
    category: itemData.category,
    status: itemData.status,
    location_path: itemData.locationPath,
    thumbnail_url: itemData.thumbnailUrl,
    amazon_link: itemData.amazonLink,
    model_path: itemData.modelPath,
    scale: itemData.scale,
    lab_id: itemData.labId,
    x: itemData.x,
    y: itemData.y,
    z: itemData.z,
    rot_x: itemData.rotX,
    rot_y: itemData.rotY,
    rot_z: itemData.rotZ,
    serial_number: itemData.serialNumber,
    asset_tag: itemData.assetTag,
    brand: itemData.brand,
    model: itemData.model,
    metadata: itemData.metadata || {},
  };

  const { data, error } = await supabase
    .from("equipment")
    .insert([dbData])
    .select()
    .single();

  if (error) throw error;

  // Map to UI structure
  return {
    id: data.qr_code,
    name: data.name,
    category: data.category,
    status: data.status,
    locationPath: data.location_path,
    thumbnailUrl: data.thumbnail_url,
    amazonLink: data.amazon_link,
    modelPath: data.model_path,
    scale: data.scale,
    labId: data.lab_id,
    x: data.x,
    y: data.y,
    z: data.z,
    serialNumber: data.serial_number,
    assetTag: data.asset_tag,
    brand: data.brand,
    model: data.model,
    metadata: data.metadata || {},
  };
}

/**
 * Update existing equipment item
 * @param {string} qrCode - QR code of the equipment
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated equipment object
 */
export async function updateEquipment(qrCode, updates) {
  const dbUpdates = {};

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.locationPath !== undefined)
    dbUpdates.location_path = updates.locationPath;
  if (updates.thumbnailUrl !== undefined)
    dbUpdates.thumbnail_url = updates.thumbnailUrl;
  if (updates.amazonLink !== undefined)
    dbUpdates.amazon_link = updates.amazonLink;
  if (updates.modelPath !== undefined) dbUpdates.model_path = updates.modelPath;
  if (updates.scale !== undefined) dbUpdates.scale = updates.scale;
  if (updates.labId !== undefined) dbUpdates.lab_id = updates.labId;
  if (updates.x !== undefined) dbUpdates.x = updates.x;
  if (updates.y !== undefined) dbUpdates.y = updates.y;
  if (updates.z !== undefined) dbUpdates.z = updates.z;
  if (updates.rotX !== undefined) dbUpdates.rot_x = updates.rotX;
  if (updates.rotY !== undefined) dbUpdates.rot_y = updates.rotY;
  if (updates.rotZ !== undefined) dbUpdates.rot_z = updates.rotZ;
  if (updates.serialNumber !== undefined)
    dbUpdates.serial_number = updates.serialNumber;
  if (updates.assetTag !== undefined) dbUpdates.asset_tag = updates.assetTag;
  if (updates.brand !== undefined) dbUpdates.brand = updates.brand;
  if (updates.model !== undefined) dbUpdates.model = updates.model;
  if (updates.metadata !== undefined) dbUpdates.metadata = updates.metadata;

  const { data, error } = await supabase
    .from("equipment")
    .update(dbUpdates)
    .eq("qr_code", qrCode)
    .select()
    .single();

  if (error) throw error;

  // Map to UI structure
  return {
    id: data.qr_code,
    name: data.name,
    category: data.category,
    status: data.status,
    locationPath: data.location_path,
    thumbnailUrl: data.thumbnail_url,
    amazonLink: data.amazon_link,
    modelPath: data.model_path,
    scale: data.scale,
    labId: data.lab_id,
    x: data.x,
    y: data.y,
    z: data.z,
    serialNumber: data.serial_number,
    assetTag: data.asset_tag,
    brand: data.brand,
    model: data.model,
    metadata: data.metadata || {},
  };
}

export async function updateEquipmentPosition(equipmentId, { x, y, z }) {
  const { data, error } = await supabase
    .from("equipment")
    .update({ x, y, z })
    .eq("id", equipmentId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete equipment item
 * @param {string} qrCode - QR code of the equipment
 * @returns {Promise<void>}
 */
export async function deleteEquipment(qrCode) {
  const { error } = await supabase
    .from("equipment")
    .delete()
    .eq("qr_code", qrCode);

  if (error) throw error;
}

/**
 * Check out an equipment item to a user
 * @param {string} qrCode - QR code of the equipment
 * @param {string} userId - User ID checking out the item
 * @returns {Promise<{success: boolean, item: Object}>}
 */
export async function checkoutItem(qrCode, userId) {
  // Step 1: Get the equipment item by qr_code to retrieve its UUID
  const { data: equipment, error: fetchError } = await supabase
    .from("equipment")
    .select("*")
    .eq("qr_code", qrCode)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch equipment: ${fetchError.message}`);
  }

  if (!equipment) {
    throw new Error("Equipment not found");
  }

  // Step 2: Check if the item is available
  if (equipment.status !== "available") {
    throw new Error(`Item is ${equipment.status} and cannot be checked out`);
  }

  // Step 3: Update equipment status to 'checked_out'
  const { error: updateError } = await supabase
    .from("equipment")
    .update({ status: "checked_out" })
    .eq("qr_code", qrCode);

  if (updateError) {
    throw new Error(
      `Failed to update equipment status: ${updateError.message}`,
    );
  }

  // Step 4: Insert checkout record into checkout_log
  const { error: logError } = await supabase.from("checkout_log").insert([
    {
      equipment_id: equipment.id,
      user_id: userId,
      checkout_date: new Date().toISOString(),
    },
  ]);

  if (logError) {
    // Rollback the status update if logging fails
    await supabase
      .from("equipment")
      .update({ status: "available" })
      .eq("qr_code", qrCode);

    throw new Error(`Failed to log checkout: ${logError.message}`);
  }

  // Step 5: Return success with item data
  return {
    success: true,
    item: {
      id: equipment.qr_code,
      name: equipment.name,
      category: equipment.category,
      status: "checked_out",
      locationPath: equipment.location_path,
      thumbnailUrl: equipment.thumbnail_url,
      amazonLink: equipment.amazon_link,
      modelPath: equipment.model_path,
      scale: equipment.scale,
      labId: equipment.lab_id,
      x: equipment.x,
      y: equipment.y,
      z: equipment.z,
    },
  };
}
