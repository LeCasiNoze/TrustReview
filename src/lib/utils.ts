export function cn(...inputs: (string | undefined)[]) {
  return inputs.filter(Boolean).join(' ')
}

/**
 * Retourne l'URL publique de base de l'application
 * Utilise NEXT_PUBLIC_APP_URL si défini, sinon fallback sur URL de production
 */
export function getPublicUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
  
  // En développement, utiliser localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  
  // En production, utiliser l'URL configurée ou fallback
  if (baseUrl && !baseUrl.includes('localhost')) {
    return baseUrl;
  }
  
  // Fallback sur URL de production
  return 'https://trustreview-eight.vercel.app';
}

/**
 * Construit l'URL publique pour une ressource
 */
export function getPublicUrlForPath(path: string): string {
  const baseUrl = getPublicUrl();
  return `${baseUrl}${path.startsWith('/') ? path : '/' + path}`;
}
