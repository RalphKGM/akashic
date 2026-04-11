import { createSupabaseClient, getUserFromToken } from "../config/supabase.js";

export const getClientAuthToken = (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return null;
    }

    return { supabase: createSupabaseClient(token), token };
}

export { getUserFromToken };