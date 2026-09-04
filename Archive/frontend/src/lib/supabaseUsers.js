import { supabase } from "./supabase";

/**
 * Get all users from the profiles table
 * @returns {Promise<Array>} Array of user profiles
 */
export async function getAllUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching users:", error);
    throw new Error(error.message || "Failed to fetch users");
  }

  return data;
}

/**
 * Update a user's role
 * @param {string} userId - UUID of the user
 * @param {string} role - New role ('admin', 'labManager', 'staff', 'viewer', 'student')
 * @returns {Promise<Object>} Updated user data
 */
export async function updateUserRole(userId, role) {
  const { data, error } = await supabase
    .from("profiles")
    .update({ role })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating user role:", error);
    throw new Error(error.message || "Failed to update user role");
  }

  return data;
}
