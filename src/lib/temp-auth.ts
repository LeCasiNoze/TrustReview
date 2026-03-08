import { cookies } from 'next/headers';

export interface TempSession {
  email: string;
  verified: boolean;
  expires: number;
}

export async function getTempSession(): Promise<TempSession | null> {
  let cookieStore;
  try {
    cookieStore = await cookies();
  } catch (error) {
    // En phase de build ou contexte statique, cookies() peut lancer une erreur
    return null;
  }

  try {
    const sessionCookie = cookieStore.get('temp-session');
    
    if (!sessionCookie) {
      return null;
    }

    const session: TempSession = JSON.parse(sessionCookie.value);
    
    // Vérifier si la session est expirée
    if (Date.now() > session.expires) {
      cookieStore.delete('temp-session');
      return null;
    }

    return session;
  } catch (error) {
    // En cas de JSON invalide ou autre, supprimer silencieusement
    try {
      cookieStore?.delete('temp-session');
    } catch {}
    return null;
  }
}

export async function createTempSession(email: string): Promise<void> {
  const cookieStore = await cookies();
  
  const session: TempSession = {
    email,
    verified: true,
    expires: Date.now() + 24 * 60 * 60 * 1000 // 24h
  };
  
  cookieStore.set('temp-session', JSON.stringify(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 // 24h en secondes
  });
}

export async function clearTempSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('temp-session');
}
