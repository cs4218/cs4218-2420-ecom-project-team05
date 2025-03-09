import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import AdminRoute from '../Routes/AdminRoute';
import { useAuth } from '../../context/auth';
import axios from 'axios';

// Mock dependencies
jest.mock('axios');
jest.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));
jest.mock('../Spinner', () => () => <div data-testid="spinner">Loading...</div>);
jest.mock('../../context/auth', () => ({
    useAuth: jest.fn().mockReturnValue([{ token: null }, jest.fn()])
  }));

describe('AdminRoute Component', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("renders spinner when auth check is going on", () => {
        useAuth.mockReturnValue([{ token: 'fake-token' }, jest.fn()]);
        axios.get.mockImplementation(() => new Promise((resolve) => {
        }));
    })

    render(<AdminRoute />)

    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();

    it("renders outlet when user is authenticated", async () => {
        useAuth.mockReturnValue([{ token: 'fake-token' }, jest.fn()]);
        axios.get.mockResolvedValue({ data: { ok: true } });

        render(<AdminRoute />)

        expect(screen.getByTestId('spinner')).toBeInTheDocument();

        // After API resolves, should show outlet
        await waitFor(() => {
            expect(screen.getByTestId('outlet')).toBeInTheDocument();
            expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
          });
        });

    it("renders spinner when user is not admin", async () => {
        useAuth.mockReturnValue([{ token: 'fake-token' }, jest.fn()]);
        axios.get.mockResolvedValue({ data: { ok: false } });

        await act(async () => render(<AdminRoute />))

        expect(screen.getByTestId('spinner')).toBeInTheDocument();

        // After API resolves, should still show spinner since user is not admin
        await waitFor(() => {
        expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
        expect(screen.getByTestId('spinner')).toBeInTheDocument();
      });
    })

    it("does not make API call when no auth token is present", async () => {
        useAuth.mockReturnValue([{ token: null }, jest.fn()]);

        await act(async () => render(<AdminRoute />))

        expect(screen.getByTestId('spinner')).toBeInTheDocument();
        expect(axios.get).not.toHaveBeenCalled();
    })

    it("makes API call with correct endpoint", async () => {
        useAuth.mockReturnValue([{ token: 'fake-token' }, jest.fn()]);
        axios.get.mockResolvedValue({ data: { ok: true } });

        await act(async () => render(<AdminRoute />))

        expect(axios.get).toHaveBeenCalledWith('/api/v1/auth/admin-auth');
    })

    it('updates state correctly when authCheck is successful', async () => {
        useAuth.mockReturnValue([{ token: 'fake-token' }, jest.fn()]);
        axios.get.mockResolvedValue({ data: { ok: true } });
    
        await act(async () => render(<AdminRoute />))
        
        // After API resolves, should show outlet (indicates setOk(true) was called)
        await waitFor(() => {
          expect(screen.getByTestId('outlet')).toBeInTheDocument();
        });
      });

      it('updates state correctly when authCheck is unsuccessful', async () => {
        useAuth.mockReturnValue([{ token: 'fake-token' }, jest.fn()]);
        axios.get.mockResolvedValue({ data: { ok: false } });
    
        await act(async () => render(<AdminRoute />))
        
        // After API resolves, should show outlet (indicates setOk(true) was called)
        await waitFor(() => {
          expect(screen.getByTestId('spinner')).toBeInTheDocument();
        });
      });
})
