import { supabase } from '../config/supabase.js';

const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password
  });
  
  if (error) throw error;
  return data;
}

const signup = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  });
  
  if (error) throw error;
  return data;
}

const verifyOtp = async (email, token) => {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup',
  });
  if (error) throw error;
  return data;
};

const resendOtp = async (email) => {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: email,
  });
  if (error) throw error;
};

const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

const getSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.access_token || null;
}

const onAuthStateChange = (callback) => {
  return supabase.auth.onAuthStateChange(callback);
}


export { login, signup, logout, getSession, onAuthStateChange, verifyOtp, resendOtp };