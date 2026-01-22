import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  getDoc,
  deleteDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { User, Project } from '../types';

// ==========================================
// CONFIGURAÇÃO DO FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDAA4gqDiKi9gqy03GbAlbrzmu-sChg6Fs",
  authDomain: "banco-de-dados-azul-creative.firebaseapp.com",
  projectId: "banco-de-dados-azul-creative",
  storageBucket: "banco-de-dados-azul-creative.firebasestorage.app",
  messagingSenderId: "625299587434",
  appId: "1:625299587434:web:312bfc295bf13a962b2513",
  measurementId: "G-8XBV4DR5CX"
};

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export const initFirebase = () => {
  // Verificação de segurança simples
  if (!firebaseConfig.apiKey) {
    console.warn("Azul Flow: Configuração do Firebase vazia. O modo offline/localstorage será usado.");
    app = null;
    db = null;
    return;
  }

  try {
    if (!app) {
        app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("Azul Flow: Firebase conectado com sucesso.");
    }
  } catch (e) {
    console.error("Azul Flow: Erro na inicialização do Firebase:", e);
    app = null;
    db = null;
  }
};

export const isFirebaseConfigured = () => !!db;

// Helper interno para tratar erros de permissão e forçar modo offline
const handleFirebaseError = (error: any) => {
    // Se for erro de permissão (regras do Firestore bloqueando), desativa o DB para a sessão
    if (error?.code === 'permission-denied' || error?.message?.includes('Missing or insufficient permissions')) {
        console.warn("Azul Flow: Permissões do Firestore negadas. Alternando automaticamente para modo Offline (LocalStorage).");
        db = null; 
        return true;
    }
    
    // Apenas loga erro real se NÃO for permissão
    console.error("Firebase Ops Error:", error);
    return false;
};

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
  } catch (error: any) {
    // Se for erro de permissão, relança para o App.tsx pegar e usar fallback
    if (handleFirebaseError(error)) {
        throw error;
    }
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
      handleFirebaseError(error);
      return { error };
  }
};

export const updateUserStatus = async (userId: string, active: boolean) => {
  if (!db) return;
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { active });
  } catch (error: any) {
    handleFirebaseError(error);
  }
};

export const deleteUserDb = async (userId: string) => {
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (error: any) {
    handleFirebaseError(error);
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
      let docs = snapshot.docs;
      
      // Fallback client-side filtering se a query falhar ou retornar desordenado
      if (userId && docs.length === 0) {
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
            userId: data.user_id,
            messages: data.messages || [] // Recupera mensagens ou array vazio
          } as Project;
      });

  } catch (error: any) {
    if (handleFirebaseError(error)) {
        return []; // Retorna vazio, mas db=null fará a próxima tentativa ser local
    }
    return [];
  }
};

// Nova função para buscar projeto único (Página Pública)
export const getProjectById = async (projectId: string): Promise<Project | null> => {
  if (!db) return null;
  
  try {
      const docRef = doc(db, 'projects', projectId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
          const data = docSnap.data();
          return {
              id: docSnap.id,
              name: data.name,
              html: data.html,
              lastModified: data.last_modified,
              userId: data.user_id
          } as Project;
      }
      return null;
  } catch (error: any) {
      console.error("Erro ao buscar projeto público:", error);
      return null;
  }
};

export const saveProjectDb = async (project: Project) => {
  if (!db) return;

  try {
      await setDoc(doc(db, 'projects', project.id), {
          name: project.name,
          html: project.html,
          last_modified: project.lastModified,
          user_id: project.userId,
          messages: project.messages || [] // Salva o histórico
      });
  } catch (error: any) {
      handleFirebaseError(error);
  }
};

export const deleteProjectDb = async (projectId: string) => {
  if (!db) return;
  try {
      await deleteDoc(doc(db, 'projects', projectId));
  } catch (error: any) {
      handleFirebaseError(error);
  }
};