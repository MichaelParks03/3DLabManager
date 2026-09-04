import { supabase } from "./supabase";

/**
 * Submit an issue report for an equipment item
 * @param {Object} issueData - Issue details
 * @param {string} issueData.itemId - QR code of the equipment
 * @param {string} issueData.type - Type of issue (Broken, Missing, etc.)
 * @param {string} issueData.notes - Additional details about the issue
 * @returns {Promise<Object>} Created issue data
 */
export async function submitIssue({ itemId, type, notes }) {
  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in to submit an issue");
  }

  // First, look up the equipment by qr_code to get its UUID id
  const { data: equipment, error: equipmentError } = await supabase
    .from("equipment")
    .select("id")
    .eq("qr_code", itemId)
    .single();

  if (equipmentError || !equipment) {
    console.error("Error finding equipment:", equipmentError);
    throw new Error("Equipment not found");
  }

  // Insert issue into the issues table with the equipment UUID
  const { data, error } = await supabase
    .from("issues")
    .insert({
      equipment_id: equipment.id,
      user_id: user.id,
      type: type,
      notes: notes,
      status: "open",
    })
    .select()
    .single();

  if (error) {
    console.error("Error submitting issue:", error);
    throw new Error(error.message || "Failed to submit issue");
  }

  return data;
}

/**
 * Get all issues for a specific equipment item
 * @param {string} itemId - QR code / ID of the equipment
 * @returns {Promise<Array>} Array of issues
 */
export async function getIssuesForItem(itemId) {
  const { data, error } = await supabase
    .from("issues")
    .select("*")
    .eq("equipment_id", itemId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching issues:", error);
    throw new Error(error.message || "Failed to fetch issues");
  }

  return data;
}

/**
 * Get all issues (for admin use)
 * @returns {Promise<Array>} Array of all issues
 */
export async function getAllIssues() {
  const { data, error } = await supabase
    .from("issues")
    .select("*, equipment(name, qr_code, lab_id)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all issues:", error);
    throw new Error(error.message || "Failed to fetch issues");
  }

  return data;
}

/**
 * Update an issue's status
 * @param {string} issueId - UUID of the issue
 * @param {string} status - New status ('open', 'in_progress', 'resolved')
 * @returns {Promise<Object>} Updated issue data
 */
export async function updateIssueStatus(issueId, status) {
  const { data, error } = await supabase
    .from("issues")
    .update({ status })
    .eq("id", issueId)
    .select()
    .single();

  if (error) {
    console.error("Error updating issue status:", error);
    throw new Error(error.message || "Failed to update issue status");
  }

  return data;
}
