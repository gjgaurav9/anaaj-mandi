import { Suspense } from 'react';
import { LoginForm } from './LoginForm';

// Wrapping the client form in <Suspense> lets Next.js statically pre-render
// the page shell even though LoginForm reads useSearchParams() at runtime.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
