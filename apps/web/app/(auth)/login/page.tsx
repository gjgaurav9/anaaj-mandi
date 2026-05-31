import { LoginForm } from './LoginForm';

// Force server-render on every hit so useSearchParams() in LoginForm doesn't
// need a static prerender path. Vercel was reliably returning Next's default
// _not-found page when this route was prerendered as static — root cause not
// yet pinpointed (route group quirk?). Dynamic render dodges the issue.
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <LoginForm />;
}
