import { useEffect, useRef } from 'react';

type GoogleWindow = Window & { google?: { accounts: { id: {
  initialize: (options: { client_id: string; callback: (result: { credential?: string }) => void }) => void;
  renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
} } } };

export default function GoogleSignInButton({ onCredential, onError, disabled }: {
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
  disabled?: boolean;
}) {
  const element = useRef<HTMLDivElement>(null);
  const handlers = useRef({ onCredential, onError });
  handlers.current = { onCredential, onError };
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    const render = () => {
      if (cancelled || !element.current) return;
      const google = (window as GoogleWindow).google;
      if (!google) return;
      element.current.replaceChildren();
      google.accounts.id.initialize({ client_id: clientId, callback: result => {
        if (result.credential) handlers.current.onCredential(result.credential);
        else handlers.current.onError('Google did not return a sign-in credential.');
      } });
      google.accounts.id.renderButton(element.current, { theme: 'outline', size: 'large', text: 'continue_with', width: 320 });
    };
    const existing = document.querySelector<HTMLScriptElement>('script[data-healix-google]');
    if ((window as GoogleWindow).google) render();
    else if (existing) existing.addEventListener('load', render);
    else {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.dataset.healixGoogle = 'true';
      script.addEventListener('load', render);
      script.addEventListener('error', () => handlers.current.onError('Google sign-in could not load.'));
      document.head.appendChild(script);
    }
    return () => { cancelled = true; existing?.removeEventListener('load', render); };
  }, [clientId]);

  if (!clientId) return (
    <div style={{ marginTop: '12px' }}>
      <button className="btn btn-ghost" style={{ width: '100%' }} type="button" disabled>
        Continue with Google
      </button>
      <p style={{ textAlign: 'center', fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '6px' }}>
        Google sign-in is not configured yet.
      </p>
    </div>
  );
  return <div ref={element} style={{ display: 'flex', justifyContent: 'center', marginTop: 16, opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }} />;
}
