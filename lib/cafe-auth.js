import { supabase } from "./supabase";

/**
 * Check if the current user is cafe staff.
 * Calls the cafe_get_hours RPC which requires cafe staff membership.
 *
 * Return values:
 * - { isStaff: true, error: null } if user is confirmed cafe staff
 * - { isStaff: false, error: null } if user is not cafe staff
 * - { isStaff: false, error: 'not_authenticated' } if user is not authenticated
 * - { isStaff: false, error: 'multiple_cafe_memberships' } if staff has multiple cafe assignments
 * - { isStaff: false, error: string } for any other error message
 */
export async function checkCafeStaffMembership() {
  const { data, error } = await supabase.rpc("cafe_get_hours");
  if (error) {
    const msg = error.message || "";
    if (msg === "not_cafe_staff" || msg.includes("not_cafe_staff")) {
      return { isStaff: false, error: null };
    }
    if (msg === "not_authenticated" || msg.includes("not_authenticated")) {
      return { isStaff: false, error: "not_authenticated" };
    }
    if (msg === "multiple_cafe_memberships" || msg.includes("multiple_cafe_memberships")) {
      return { isStaff: false, error: "multiple_cafe_memberships" };
    }
    return { isStaff: false, error: error.message };
  }
  return { isStaff: true, error: null };
}
