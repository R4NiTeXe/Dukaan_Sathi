import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

const push = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/',
}));

vi.mock('@/services/api', () => ({
  default: {
    post: vi.fn(),
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  },
}));

import api from '@/services/api';

const Probe = ({ onResult }) => {
  const { user, login, logout, register } = useAuth();
  const runLogin = async () => onResult(await login({ email: 'a@b.com', password: 'secret123' }));
  const runRegister = async () =>
    onResult(await register({ ownerName: 'Ravi', email: 'a@b.com', password: 'secret123' }));
  return (
    <div>
      <span data-testid="user">{user ? user.ownerName : 'none'}</span>
      <button onClick={runLogin}>login</button>
      <button onClick={runRegister}>register</button>
      <button onClick={logout}>logout</button>
    </div>
  );
};

const renderApp = (onResult = vi.fn()) =>
  render(
    <AuthProvider>
      <Probe onResult={onResult} />
    </AuthProvider>
  );

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

describe('AuthContext', () => {
  it('stores the session and redirects home after a successful login', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: { user: { ownerName: 'Ravi' }, accessToken: 'abc123' },
      },
    });

    renderApp();

    screen.getByText('login').click();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Ravi'));

    expect(localStorage.getItem('accessToken')).toBe('abc123');
    expect(localStorage.getItem('user')).toContain('Ravi');
    // refresh token must NOT be stored — it lives in the httpOnly cookie
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(push).toHaveBeenCalledWith('/');
  });

  it('returns a friendly message when login fails', async () => {
    api.post.mockRejectedValueOnce({
      response: { data: { message: 'Invalid email or password' } },
    });

    const onResult = vi.fn();
    renderApp(onResult);

    screen.getByText('login').click();
    await waitFor(() => expect(onResult).toHaveBeenCalled());

    expect(onResult).toHaveBeenCalledWith({
      success: false,
      message: 'Invalid email or password',
    });
    expect(localStorage.getItem('accessToken')).toBeNull();
  });

  it('stores the session and routes to profile setup after a successful register', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: { user: { ownerName: 'Ravi' }, accessToken: 'reg456' },
      },
    });

    renderApp();

    screen.getByText('register').click();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('Ravi'));

    expect(localStorage.getItem('accessToken')).toBe('reg456');
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(push).toHaveBeenCalledWith('/profile?setup=1');
  });

  it('clears the session on logout', async () => {
    localStorage.setItem('accessToken', 'abc123');
    localStorage.setItem('user', JSON.stringify({ ownerName: 'Ravi' }));

    renderApp();

    screen.getByText('logout').click();
    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('none'));

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(push).toHaveBeenCalledWith('/login');
  });
});
