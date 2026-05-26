/**
 * Google OAuth Initialization and Flow Manager
 * 
 * Usage:
 * 1. Make sure VITE_GOOGLE_CLIENT_ID is set in .env
 * 2. Import and call initGoogleSDK() in your App component or main layout
 * 3. Use useGoogleAuth() hook to get OAuth functions in your components
 */

interface GoogleGsi {
  accounts: {
    id: {
      initialize: (config: { client_id: string; callback: (res: { credential?: string }) => void }) => void;
      prompt: (promptHandler?: unknown, errorCallback?: () => void) => void;
      renderButton: (element: HTMLElement | null, options: unknown) => void;
    };
  };
}

const getGoogle = (): GoogleGsi | undefined => {
  if (typeof window !== 'undefined') {
    return (window as unknown as { google?: GoogleGsi }).google;
  }
  return undefined;
};

export function initGoogleSDK() {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}

export function startGoogleOAuthFlow(clientId: string, redirectUri: string) {
  const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
  });
  
  window.location.href = `${authUrl}?${params.toString()}`;
}

export function getAuthorizationCodeFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get('code');
}

/**
 * Google One Tap Sign-In Integration
 * Use this for One Tap UI
 */
export function renderGoogleOneTap(elementId: string, options?: unknown) {
  const google = getGoogle();
  if (google) {
    google.accounts.id.renderButton(
      document.getElementById(elementId),
      options || {
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
      }
    );
  }
}

/**
 * Initialize Google One Tap
 */
export function initializeGoogleOneTap(
  clientId: string,
  onSuccess: (credentialResponse: { credential?: string }) => void,
  onError?: () => void
) {
  const google = getGoogle();
  if (google) {
    google.accounts.id.initialize({
      client_id: clientId,
      callback: onSuccess,
    });
    google.accounts.id.prompt(undefined, onError);
  }
}
