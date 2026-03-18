/**
 * Utilitário para chamadas API ao Backend próprio
 */

const API_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
        ? 'https://clrodrigues-sendmessage-backend.rsybpi.easypanel.host'
        : 'http://localhost:4000');

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('auth_token');

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...((options.headers as any) || {}),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (response.status === 401 || response.status === 403) {
        // Token expirado ou inválido — limpa storage e lança erro controlado
        // NÃO fazemos reload aqui: o React cuida do redirecionamento via estado
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        const authError = new Error('AUTH_EXPIRED');
        (authError as any).status = response.status;
        throw authError;
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erro na requisição: ${response.status}`);
    }

    return response.json();
}
