import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, useAuth } from './auth';
import axios from 'axios';
import React from "react";

jest.mock('axios');

beforeAll(() => {
  Storage.prototype.getItem = jest.fn(() => JSON.stringify({ user: 'mockUser', token: 'mockToken' }));
  Storage.prototype.setItem = jest.fn();
});

describe('AuthProvider Component', () => {
  it('sets the auth state from localStorage on mount', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // Wait for the state update from useEffect
    await act(async () => {});

    // Ensure that the token and user from localStorage are used to update the auth state
    expect(screen.getByText('User: mockUser')).toBeInTheDocument();
    expect(screen.getByText('Token: mockToken')).toBeInTheDocument();
  });

  it('calls axios.defaults.headers.common["Authorization"] with token', async () => {
    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // Wait for the useEffect to finish
    await act(async () => {});

    // Check if axios.defaults.headers.common['Authorization'] is set
    expect(axios.defaults.headers.common['Authorization']).toBe('mockToken');
  });

  it('sets auth state correctly when localStorage has no data', async () => {
    Storage.prototype.getItem = jest.fn(() => null);

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>
    );

    // Wait for the state update from useEffect
    await act(async () => {});

    // Check if the auth state is set to its initial values ('', '')
    expect(screen.getByText('User:')).toBeInTheDocument();
    expect(screen.getByText('Token:')).toBeInTheDocument();
  });
});

// Component to test useAuth hook
const AuthConsumer = () => {
  const [auth] = useAuth();
  return (
    <>
      <div>User: {auth.user}</div>
      <div>Token: {auth.token}</div>
    </>
  );
};
