import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { User, Project } from '../types';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export const initFirebase = (configJson: string) => {
  if (!configJson) {
    app = null;
    db = null;
    return;
  }

  try {
    const config = JSON.parse(configJson);
    // Evita reinicializar se já existir com a mesma config (básico)
    if (!app) {
        app = initializeApp(config);
        db = getFirestore(app);
    }
  } catch (e) {
    console.error("Configuração do Firebase inválida:", e);
    app = null;
    db = null;
  }
};

export const isFirebaseConfigured = () => !!db;

// --- Users ---

export const fetchUsers = async (): Promise<User[]> => {
  if (!db) return [];
  
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);
    const usersList = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            username: data.username,
            password: data.password, 
            role: data.role,
            active: data.active,
            isAuthenticated: false
        } as User;
    });
    return usersList;
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return [];
  }
};

export const createUser = async (user: User) => {
  if (!db) return { error: { message: "Firebase não conectado" } };
  
  try {
    // Usamos o ID do usuário como ID do documento
    await setDoc(doc(db, 'users', user.id), {
      username: user.username,
      password: user.password,
      role: user.role,
      active: user.active
    });
    return { data: user };
  } catch (error: any) {
      console.error('Error creating user:', error);
      return { error };
  }
};

export const updateUserStatus = async (userId: string, active: boolean) => {
  if (!db) return;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { active });
  } catch (error) {
    console.error('Error updating user:', error);
  }
};

export const deleteUserDb = async (userId: string) => {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    console.error('Error deleting user:', error);
  }
};

// --- Projects ---

export const fetchProjects = async (userId?: string): Promise<Project[]> => {
  if (!db) return [];

  try {
      const projectsCol = collection(db, 'projects');
      let q = query(projectsCol, orderBy('last_modified', 'desc'));

      if (userId) {
          q = query(projectsCol, where('user_id', '==', userId), orderBy('last_modified', 'desc'));
      }

      const snapshot = await getDocs(q);
      
      // Filtragem manual caso o índice composto não exista ainda no Firestore
      // (O Firestore exige índice para queries com where + orderBy em campos diferentes)
      let docs = snapshot.docs;
      
      // Fallback client-side filtering se a query falhar ou retornar desordenado por falta de índice
      if (userId && docs.length === 0) {
        // Tenta buscar tudo e filtrar no cliente se o índice estiver faltando (para dev)
        // Em produção, deve-se criar o índice no console do Firebase
        const allSnapshot = await getDocs(projectsCol);
        docs = allSnapshot.docs.filter(d => d.data().user_id === userId);
        docs.sort((a, b) => b.data().last_modified - a.data().last_modified);
      }

      return docs.map(d => {
          const data = d.data();
          return {
            id: d.id,
            name: data.name,
            html: data.html,
            lastModified: data.last_modified,
            userId: data.user_id
          } as Project;
      });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return [];
  }
};

export const saveProjectDb = async (project: Project) => {
  if (!db) return;

  try {
      await setDoc(doc(db, 'projects', project.id), {
          name: project.name,
          html: project.html,
          last_modified: project.lastModified,
          user_id: project.userId
      });
  } catch (error) {
      console.error('Error saving project:', error);
  }
};

export const deleteProjectDb = async (projectId: string) => {
  if (!db) return;
  try {
      await deleteDoc(doc(db, 'projects', projectId));
  } catch (error) {
      console.error('Error deleting project:', error);
  }
};
