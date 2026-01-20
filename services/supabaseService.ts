import { User, Project } from '../types';

// Supabase is currently disabled in favor of Firebase.
// This file is kept as a stub to prevent build errors.

export const initSupabase = (url: string, key: string) => {
  console.warn("Supabase integration is disabled.");
};

export const isSupabaseConfigured = () => false;

export const fetchUsers = async (): Promise<User[]> => {
  return [];
};

export const createUser = async (user: User) => {
  return { error: { message: "Supabase disabled" } };
};

export const updateUserStatus = async (userId: string, active: boolean) => {};

export const deleteUserDb = async (userId: string) => {};

export const fetchProjects = async (userId?: string): Promise<Project[]> => {
  return [];
};

export const saveProjectDb = async (project: Project) => {};

export const deleteProjectDb = async (projectId: string) => {};
