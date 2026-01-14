import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { User, Project } from '../types';

let supabase: SupabaseClient | null = null;

export const initSupabase = (url: string, key: string) => {
  if (url && key) {
    supabase = createClient(url, key);
  } else {
    supabase = null;
  }
};

export const isSupabaseConfigured = () => !!supabase;

// --- Users ---

export const fetchUsers = async (): Promise<User[]> => {
  if (!supabase) return [];
  
  const { data, error } = await supabase
    .from('users')
    .select('*');

  if (error) {
    console.error('Error fetching users:', error);
    return [];
  }
  
  return data.map((u: any) => ({
    id: u.id,
    username: u.username,
    password: u.password, // Em um app real, nunca retornaríamos a senha crua
    role: u.role,
    active: u.active,
    isAuthenticated: false
  }));
};

export const createUser = async (user: User) => {
  if (!supabase) return { error: { message: "Supabase não conectado" } };
  
  const { data, error } = await supabase
    .from('users')
    .insert([{
      id: user.id,
      username: user.username,
      password: user.password,
      role: user.role,
      active: user.active
    }])
    .select();

  if (error) {
      console.error('Error creating user:', error);
      return { error };
  }
  return { data };
};

export const updateUserStatus = async (userId: string, active: boolean) => {
  if (!supabase) return;
  
  const { error } = await supabase
    .from('users')
    .update({ active })
    .eq('id', userId);

  if (error) console.error('Error updating user:', error);
};

export const deleteUserDb = async (userId: string) => {
  if (!supabase) return;
  
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) console.error('Error deleting user:', error);
};

// --- Projects ---

export const fetchProjects = async (userId?: string): Promise<Project[]> => {
  if (!supabase) return [];

  let query = supabase
    .from('projects')
    .select('*')
    .order('last_modified', { ascending: false });

  // Se um userId for fornecido, filtra. Se for undefined (admin), traz tudo.
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching projects:', error);
    return [];
  }

  return data.map((p: any) => ({
    id: p.id,
    name: p.name,
    html: p.html,
    lastModified: p.last_modified,
    userId: p.user_id
  }));
};

export const saveProjectDb = async (project: Project) => {
  if (!supabase) return;

  const { error } = await supabase
    .from('projects')
    .upsert({
      id: project.id,
      name: project.name,
      html: project.html,
      last_modified: project.lastModified,
      user_id: project.userId
    });

  if (error) console.error('Error saving project:', error);
};

export const deleteProjectDb = async (projectId: string) => {
  if (!supabase) return;

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId);

  if (error) console.error('Error deleting project:', error);
};