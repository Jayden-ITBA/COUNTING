import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../Login';
import { signInWithEmailAndPassword } from 'firebase/auth';

// Mock the navigate function
const mockedUsedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockedUsedNavigate,
    };
});

describe('Login Component', () => {
    it('renders login form correctly', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        expect(screen.getByPlaceholderText(/Nhập email của bạn/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Nhập mật khẩu/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Đăng nhập/i })).toBeInTheDocument();
    });

    it('updates email and password fields on change', () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        const emailInput = screen.getByPlaceholderText(/Nhập email của bạn/i);
        const passwordInput = screen.getByPlaceholderText(/Nhập mật khẩu/i);

        fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
        fireEvent.change(passwordInput, { target: { value: 'password123' } });

        expect(emailInput.value).toBe('test@example.com');
        expect(passwordInput.value).toBe('password123');
    });

    it('calls signInWithEmailAndPassword on form submit', async () => {
        render(
            <BrowserRouter>
                <Login />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/Nhập email của bạn/i), { target: { value: 'test@example.com' } });
        fireEvent.change(screen.getByPlaceholderText(/Nhập mật khẩu/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Đăng nhập/i }));

        await waitFor(() => {
            expect(signInWithEmailAndPassword).toHaveBeenCalled();
        });
    });
});
