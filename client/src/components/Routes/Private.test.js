import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Private from './Private';
import { useAuth } from '../../context/auth';
import axios from 'axios';

jest.mock('axios');
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn()
}))
jest.mock('react-router-dom', () => ({
    Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));
jest.mock('../Spinner', () => ({ path }) => <div data-testid="spinner" data-path={path}>Loading...</div>);

describe('PrivateRoute Component', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it("renders spinner when auth check is in progress", () => {
        useAuth.mockReturnValue([{ token: 'fake-token' }, jest.fn()]);
        axios.get.mockImplementation(() => new Promise((resolve) => {
            
        }))

    render(<Private/>)

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
    })

    it("renders outlet component when user is authneticated", async () => {
        useAuth.mockReturnValue([{ token: 'fake-token' }, jest.fn()]);
        axios.get.mockResolvedValue({ data: { ok: true } });

        render(<Private/>)

        expect(screen.getByTestId('spinner')).toBeInTheDocument();

        // After API resolves, should show outlet
        await waitFor(() => {
            expect(screen.getByTestId('outlet')).toBeInTheDocument();
            expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
          });
    })

    it("renders spinner when user is not authenticated", async () => {
        useAuth.mockReturnValue([{ token: 'fake-token' }, jest.fn()]);
        axios.get.mockResolvedValue({ data: { ok: false } });

        render(<Private/>)

        expect(screen.getByTestId('spinner')).toBeInTheDocument();

        // After API resolves, should still show spinner since user is not authenticated
        await waitFor(() => {
            expect(screen.getByTestId('spinner')).toBeInTheDocument();
            expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
        })
    })

    it("does not make API call when no auth token is present", () => {
        useAuth.mockReturnValue([{ token: null }, jest.fn()]);

        render(<Private/>)

        expect(screen.getByTestId('spinner')).toBeInTheDocument();
        expect(axios.get).not.toHaveBeenCalled();
    })

    it("makes API call with correct endpoint", () => {
        useAuth.mockReturnValue([{ token: 'fake-token' }, jest.fn()]);
        axios.get.mockResolvedValue({ data: { ok: true } });

        render(<Private/>)

        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
    })

    it("passes empty path prop to Spinner component", () => {
        useAuth.mockReturnValue([{ token: 'fake-token' }, jest.fn()]);

        render(<Private/>)

        expect(screen.getByTestId('spinner')).toHaveAttribute('data-path', '');
    })

    it("updates state correcty when authCheck is successful", async () => {
        useAuth.mockReturnValue([{ token: 'fake-token' }, jest.fn()]);
        axios.get.mockResolvedValue({ data: { ok: true } });

        render(<Private/>)

        await waitFor(() => {
            expect(screen.getByTestId('outlet')).toBeInTheDocument();
        })

    })

    it("updates state correctly when authCheck fails", async () => {
        useAuth.mockReturnValue([{ token: 'fake-token' }, jest.fn()]);
        axios.get.mockResolvedValue({ data: { ok: false } });
        render(<Private/>)
        await waitFor(() => {
            expect(screen.getByTestId('spinner')).toBeInTheDocument();
        })
    })

    it("re-runs auth check when token changes", async () => {
        const setAuth= jest.fn()
        useAuth.mockReturnValue([{ token: 'fake-token' }, setAuth]);
        const renderer = render(<Private/>)

        expect(axios.get).toHaveBeenCalledTimes(1)
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth')

        // Reset the mock before testing the token change
        axios.get.mockClear()
        
        // Simulate token change
        useAuth.mockReturnValue([{ token: 'new-token' }, setAuth]);
        axios.get.mockResolvedValue({ data: { ok: true } });

        // Rerender component
        renderer.rerender(<Private/>)

        // API call made with new token
        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/user-auth');
        
        await waitFor(() => {
            expect(screen.getByTestId('outlet')).toBeInTheDocument();
        })
    })
    
})