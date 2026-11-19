import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from '@souk/shared';
import { Button } from '../../components/ui/Button';
import { TextField } from '../../components/ui/Field';
import { ApiError } from '../../lib/api';
import { useCart } from '../../lib/cart';
import { useLogin, useMe, useRegister } from '../../lib/queries';

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { data: me } = useMe();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const { count } = useCart();
  if (me) return <Navigate to={from} replace />;

  return (
    <div className="mx-auto max-w-md px-4 pt-14 sm:px-6">
      <h1 className="font-display text-[32px] font-extrabold tracking-tight sm:text-[40px]">{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>
      <p className="mt-2 text-ink-muted">
        {from === '/checkout' ? `Sign in to finish your order. ${count ? `Your ${count} item${count === 1 ? '' : 's'} stay in the basket.` : ''}` : mode === 'login' ? 'Sign in to see your orders.' : 'One account for checkout and order tracking.'}
      </p>
      {mode === 'login' ? <LoginForm from={from} /> : <RegisterForm from={from} />}
    </div>
  );
}

function LoginForm({ from }: { from: string }) {
  const login = useLogin();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });
  return (
    <>
      <form noValidate className="mt-8 flex flex-col gap-5" onSubmit={handleSubmit((v) => login.mutate(v, { onSuccess: () => navigate(from, { replace: true }) }))}>
        {login.error && <p role="alert" className="rounded-control bg-danger-soft px-3 py-2.5 text-sm text-danger">{login.error instanceof ApiError ? login.error.message : 'Sign-in failed.'}</p>}
        <TextField label="Email" type="email" autoComplete="username" autoFocus error={errors.email?.message} {...register('email')} />
        <TextField label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        <Button type="submit" variant="primary" loading={login.isPending} className="h-12 text-base">Sign in</Button>
      </form>
      <p className="mt-6 text-sm text-ink-muted">New to Souk? <Link to="/register" state={{ from }} className="font-semibold text-brand underline">Create an account</Link></p>
      <div className="mt-8 rounded-control bg-sunken px-4 py-3 text-sm text-ink-muted">
        <p>Customer: <span className="font-medium text-ink">customer@souk.dev</span> / <span className="font-medium text-ink">Souk!2026</span></p>
        <p className="mt-1">Shop staff: <span className="font-medium text-ink">admin@souk.dev</span> / <span className="font-medium text-ink">Souk!2026</span></p>
      </div>
    </>
  );
}

function RegisterForm({ from }: { from: string }) {
  const signUp = useRegister();
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors } } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });
  return (
    <>
      <form
        noValidate
        className="mt-8 flex flex-col gap-5"
        onSubmit={handleSubmit((v) =>
          signUp.mutate(v, {
            onSuccess: () => navigate(from, { replace: true }),
            onError: (e) => { if (e instanceof ApiError && e.fields) for (const [f, m] of Object.entries(e.fields)) setError(f as keyof RegisterInput, { message: m }); },
          }),
        )}
      >
        <TextField label="Your name" autoComplete="name" autoFocus error={errors.name?.message} {...register('name')} />
        <TextField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
        <TextField label="Password" type="password" autoComplete="new-password" hint="At least 8 characters" error={errors.password?.message} {...register('password')} />
        <Button type="submit" variant="primary" loading={signUp.isPending} className="h-12 text-base">Create account</Button>
      </form>
      <p className="mt-6 text-sm text-ink-muted">Already have one? <Link to="/login" state={{ from }} className="font-semibold text-brand underline">Sign in</Link></p>
    </>
  );
}
