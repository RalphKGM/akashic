import { createAdminSupabaseClient } from '../config/supabase.js';
import { createHttpError } from '../utils/http.js';

export const deleteAccount = async (userId) => {
  if (!userId) {
    throw createHttpError(400, 'User ID is required', 'USER_ID_REQUIRED');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw createHttpError(
      503,
      'Account deletion requires SUPABASE_SERVICE_ROLE_KEY',
      'SERVICE_ROLE_REQUIRED'
    );
  }

  const adminSupabase = createAdminSupabaseClient();

  const deleteByUserId = async (table) => {
    const { error } = await adminSupabase
      .from(table)
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  };

  await deleteByUserId('known_face');
  await deleteByUserId('album');
  await deleteByUserId('photo');

  const { error: deleteUserError } = await adminSupabase.auth.admin.deleteUser(userId);
  if (deleteUserError) throw deleteUserError;

  return { success: true, userId };
};
