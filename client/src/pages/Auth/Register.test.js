/* eslint-disable testing-library/prefer-screen-queries */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import '@testing-library/jest-dom/extend-expect';
import toast from 'react-hot-toast';
import Register from './Register';
import timezoneMock from 'timezone-mock';

// Mocking axios.post
jest.mock('axios');
jest.mock('react-hot-toast');

jest.mock('../../context/auth', () => ({
    useAuth: jest.fn(() => [null, jest.fn()]) // Mock useAuth hook to return null state and a mock function for setAuth
  }));

  jest.mock('../../context/cart', () => ({
    useCart: jest.fn(() => [null, jest.fn()]) // Mock useCart hook to return null state and a mock function
  }));
    
jest.mock('../../context/search', () => ({
    useSearch: jest.fn(() => [{ keyword: '' }, jest.fn()]) // Mock useSearch hook to return null state and a mock function
  }));  

  jest.mock("../../hooks/useCategory", () => jest.fn(() => []));

  Object.defineProperty(window, 'localStorage', {
    value: {
      setItem: jest.fn(),
      getItem: jest.fn(),
      removeItem: jest.fn(),
    },
    writable: true,
  });

window.matchMedia = window.matchMedia || function() {
    return {
      matches: false,
      addListener: function() {},
      removeListener: function() {}
    };
  };
      

describe('Register Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to fill out the form
  const fillForm = (getByPlaceholderText, values) => {
    if (values.name !== undefined) {
      fireEvent.change(getByPlaceholderText('Enter Your Name'), { target: { value: values.name } });
    }
    if (values.email !== undefined) {
      fireEvent.change(getByPlaceholderText('Enter Your Email'), { target: { value: values.email } });
    }
    if (values.password !== undefined) {
      fireEvent.change(getByPlaceholderText('Enter Your Password'), { target: { value: values.password } });
    }
    if (values.phone !== undefined) {
      fireEvent.change(getByPlaceholderText('Enter Your Phone'), { target: { value: values.phone } });
    }
    if (values.address !== undefined) {
      fireEvent.change(getByPlaceholderText('Enter Your Address'), { target: { value: values.address } });
    }
    if (values.dob !== undefined) {
      fireEvent.change(getByPlaceholderText('Enter Your DOB'), { target: { value: values.dob } });
    }
    if (values.answer !== undefined) {
      fireEvent.change(getByPlaceholderText('What is Your Favorite Sport?'), { target: { value: values.answer } });
    }
  };

  it('should register the user successfully', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText, getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fillForm(getByPlaceholderText, {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '1234567890',
        address: '123 Street',
        dob: '2000-01-01',
        answer: 'Football'
      });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.success).toHaveBeenCalledWith("Registered Successfully, Please Login!")
  });

  it('should display error message on failed registration', async () => {
    axios.post.mockRejectedValueOnce({ message: 'User already exists' });

    const { getByText, getByPlaceholderText } = render(
        <MemoryRouter initialEntries={['/register']}>
          <Routes>
            <Route path="/register" element={<Register />} />
          </Routes>
        </MemoryRouter>
      );

      fillForm(getByPlaceholderText, {
        name: 'John Doe',
        email: 'test@example.com',
        password: 'Password123!',
        phone: '1234567890',
        address: '123 Street',
        dob: '2000-01-01',
        answer: 'Football'
      });

    fireEvent.click(getByText('REGISTER'));

    await waitFor(() => expect(axios.post).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith('Something went wrong');
  });

// Name field tests
describe('Name Field Validation', () => {
  it('should accept valid names', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Test regular name
    fillForm(getByPlaceholderText, { name: 'John Doe' });
    fireEvent.blur(getByPlaceholderText('Enter Your Name'));
    expect(queryByText(/name is invalid/i)).not.toBeInTheDocument();

    // Test name with special characters
    fillForm(getByPlaceholderText, { name: 'María-José O\'Connor' });
    fireEvent.blur(getByPlaceholderText('Enter Your Name'));
    expect(queryByText(/name is invalid/i)).not.toBeInTheDocument();
  });

  it('should reject invalid names', async () => {
    const { getByPlaceholderText, findByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );
  
    // Test empty name
    fillForm(getByPlaceholderText, { name: '' });
    fireEvent.blur(getByPlaceholderText('Enter Your Name'));
    await findByText(/name is required/i);
  
    // Test name with only numbers
    fillForm(getByPlaceholderText, { name: '12345' });
    fireEvent.blur(getByPlaceholderText('Enter Your Name'));
    await findByText(/name must contain at least one letter/i);
  
    // Test name that's too short
    fillForm(getByPlaceholderText, { name: 'J' });
    fireEvent.blur(getByPlaceholderText('Enter Your Name'));
    await findByText(/name must be at least 3 characters long/i);
  
    // Test name with only symbols
    fillForm(getByPlaceholderText, { name: '@#$%' });
    fireEvent.blur(getByPlaceholderText('Enter Your Name'));
    await findByText(/name cannot contain only symbols/i);
  });  
});

// Email field tests
describe('Email Field Validation', () => {
  it('should accept valid emails', async () => {
    const { getByPlaceholderText, queryByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Test standard email
    fillForm(getByPlaceholderText, { email: 'user@example.com' });
    fireEvent.blur(getByPlaceholderText('Enter Your Email'));
    expect(queryByText(/email is invalid/i)).not.toBeInTheDocument();

    // Test complex email
    fillForm(getByPlaceholderText, { email: 'john.doe@sub.domain.com' });
    fireEvent.blur(getByPlaceholderText('Enter Your Email'));
    expect(queryByText(/email is invalid/i)).not.toBeInTheDocument();
  });

  it('should reject invalid emails', async () => {
    const { getByPlaceholderText, findByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Test empty email
    fillForm(getByPlaceholderText, { email: '' });
    fireEvent.blur(getByPlaceholderText('Enter Your Email'));
    await findByText(/email is required/i);

    // Test email missing @
    fillForm(getByPlaceholderText, { email: 'userexample.com' });
    fireEvent.blur(getByPlaceholderText('Enter Your Email'));
    await findByText(/email is invalid/i);

    // Test email missing username
    fillForm(getByPlaceholderText, { email: '@example.com' });
    fireEvent.blur(getByPlaceholderText('Enter Your Email'));
    await findByText(/email is invalid/i);

    // Test email missing domain name
    fillForm(getByPlaceholderText, { email: 'user@.com' });
    fireEvent.blur(getByPlaceholderText('Enter Your Email'));
    await findByText(/email is invalid/i);

    // Test email missing dot in domain
    fillForm(getByPlaceholderText, { email: 'user@com' });
    fireEvent.blur(getByPlaceholderText('Enter Your Email'));
    await findByText(/email is invalid/i);
  });
});

// Password field tests
describe('Password Field Validation', () => {
  it('should accept valid passwords', async () => {
    const { getByPlaceholderText, queryByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Test strong password
    fillForm(getByPlaceholderText, { password: 'Password123!' });
    fireEvent.blur(getByPlaceholderText('Enter Your Password'));
    expect(queryByText(/password is invalid/i)).not.toBeInTheDocument();
  });

  it('should reject invalid passwords', async () => {
    const { getByPlaceholderText, findByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Test empty password
    fillForm(getByPlaceholderText, { password: '' });
    fireEvent.blur(getByPlaceholderText('Enter Your Password'));
    await findByText(/password is required/i);

    // Test password too short
    fillForm(getByPlaceholderText, { password: 'short' });
    fireEvent.blur(getByPlaceholderText('Enter Your Password'));
    await findByText(/password must be at least 6 characters/i);

    // Test weak password (only lowercase)
    fillForm(getByPlaceholderText, { password: 'password' });
    fireEvent.blur(getByPlaceholderText('Enter Your Password'));
    await findByText(/Password must contain at least one letter and one number./i)

    // Test password with only numbers
    fillForm(getByPlaceholderText, { password: '12345678' });
    fireEvent.blur(getByPlaceholderText('Enter Your Password'));
    await findByText(/Password must contain at least one letter and one number./i)
  });
});

// Phone field tests
describe('Phone Field Validation', () => {
  it('should accept valid phone numbers', async () => {
    const { getByPlaceholderText, queryByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Test 10-digit phone number
    fillForm(getByPlaceholderText, { phone: '1234567890' });
    fireEvent.blur(getByPlaceholderText('Enter Your Phone'));
    expect(queryByText(/phone is invalid/i)).not.toBeInTheDocument();

    // Test formatted international number
    fillForm(getByPlaceholderText, { phone: '+1-234-567-8901' });
    fireEvent.blur(getByPlaceholderText('Enter Your Phone'));
    expect(queryByText(/phone is invalid/i)).not.toBeInTheDocument();
  });

  it('should reject invalid phone numbers', async () => {
    const { getByPlaceholderText, findByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Test empty phone
  fillForm(getByPlaceholderText, { phone: '' });
  fireEvent.blur(getByPlaceholderText('Enter Your Phone'));
  await findByText(/phone number is required/i);

  // Test letters in phone
  fillForm(getByPlaceholderText, { phone: 'abcdefg' });
  fireEvent.blur(getByPlaceholderText('Enter Your Phone'));
  await findByText(/phone number contains invalid characters/i);

  // Test phone with only symbols
  fillForm(getByPlaceholderText, { phone: '++-#--' });
  fireEvent.blur(getByPlaceholderText('Enter Your Phone'));
  await findByText(/phone number cannot contain only symbols/i);

  // Test phone too short
  fillForm(getByPlaceholderText, { phone: '12345' });
  fireEvent.blur(getByPlaceholderText('Enter Your Phone'));
  await findByText(/phone number is too short/i);

  // Test phone too long
  fillForm(getByPlaceholderText, { phone: '1234567890123450' });
  fireEvent.blur(getByPlaceholderText('Enter Your Phone'));
  await findByText(/phone number is too long/i);
  });
});

// Address field tests
describe('Address Field Validation', () => {
  it('should accept valid addresses', async () => {
    const { getByPlaceholderText, queryByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Test standard address
    fillForm(getByPlaceholderText, { address: '123 Main Street, City, Country' });
    fireEvent.blur(getByPlaceholderText('Enter Your Address'));
    expect(queryByText(/address is invalid/i)).not.toBeInTheDocument();

    // Test complex address
    fillForm(getByPlaceholderText, { address: 'Apt 45, Building B, Some Area' });
    fireEvent.blur(getByPlaceholderText('Enter Your Address'));
    expect(queryByText(/address is invalid/i)).not.toBeInTheDocument();
  });

  it('should reject empty address', async () => {
    const { getByPlaceholderText, findByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Test empty address
    fillForm(getByPlaceholderText, { address: '' });
    fireEvent.blur(getByPlaceholderText('Enter Your Address'));
    await findByText(/address is required/i);
  });
});

// DOB field tests
describe('DOB Field Validation', () => {
  it('should accept valid dates of birth', async () => {
    const { getByPlaceholderText, queryByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Test past date
    fillForm(getByPlaceholderText, { dob: '2000-05-20' });
    fireEvent.blur(getByPlaceholderText('Enter Your DOB'));
    expect(queryByText(/date of birth is invalid/i)).not.toBeInTheDocument();

    // Test another past date
    fillForm(getByPlaceholderText, { dob: '1995-12-31' });
    fireEvent.blur(getByPlaceholderText('Enter Your DOB'));
    expect(queryByText(/date of birth is invalid/i)).not.toBeInTheDocument();
  });

  it('should reject invalid dates of birth', async () => {
    const { getByPlaceholderText, findByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Test empty DOB
    fillForm(getByPlaceholderText, { dob: '' });
    fireEvent.blur(getByPlaceholderText('Enter Your DOB'));
    await findByText(/date of birth is required/i);

    // Test future date
    fillForm(getByPlaceholderText, { dob: '2026-01-01' });
    fireEvent.blur(getByPlaceholderText('Enter Your DOB'));
    await findByText(/date of birth cannot be in the future/i);

    // Test current date
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayFormatted = `${year}-${month}-${day}`;

    fillForm(getByPlaceholderText, { dob: todayFormatted });
    fireEvent.blur(getByPlaceholderText("Enter Your DOB"));
    await findByText(/date of birth cannot be today/i)
  })
})

// Favorite sport field tests
describe('Favorite Sport Field Validation', () => {
  it('should accept valid sport names', async () => {
    const { getByPlaceholderText, queryByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Test basketball
    fillForm(getByPlaceholderText, { answer: 'Basketball' });
    fireEvent.blur(getByPlaceholderText('What is Your Favorite Sport?'));
    expect(queryByText(/favorite sport is invalid/i)).not.toBeInTheDocument();

    // Test football
    fillForm(getByPlaceholderText, { answer: 'Football' });
    fireEvent.blur(getByPlaceholderText('What is Your Favorite Sport?'));
    expect(queryByText(/favorite sport is invalid/i)).not.toBeInTheDocument();
  });

  it('should reject invalid sport names', async () => {
    const { getByPlaceholderText, findByText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Test empty sport
    fillForm(getByPlaceholderText, { answer: '' });
    fireEvent.blur(getByPlaceholderText('What is Your Favorite Sport?'));
    await findByText(/favorite sport is required/i);

    // Test single-letter sport
    fillForm(getByPlaceholderText, { answer: 'a' });
    fireEvent.blur(getByPlaceholderText('What is Your Favorite Sport?'));
    await findByText(/favorite sport is too short/i);
  });
});

// Form submission tests
describe('Form Submission', () => {
  it('should not submit if any field is empty', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Fill form with all fields except name
    fillForm(getByPlaceholderText, {
      email: 'test@example.com',
      password: 'Password123!',
      phone: '1234567890',
      address: '123 Street',
      dob: '2000-01-01',
      answer: 'Football'
    });

    fireEvent.click(getByText('REGISTER'));
    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  it('should not submit if any validation fails', async () => {
    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Fill form with invalid email
    fillForm(getByPlaceholderText, {
      name: 'John Doe',
      email: 'invalid-email',
      password: 'Password123!',
      phone: '1234567890',
      address: '123 Street',
      dob: '2000-01-01',
      answer: 'Football'
    });

    fireEvent.click(getByText('REGISTER'));
    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  it('should submit when all fields are valid', async () => {
    axios.post.mockResolvedValueOnce({ data: { success: true } });

    const { getByText, getByPlaceholderText } = render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
        </Routes>
      </MemoryRouter>
    );

    // Fill form with all valid fields
    fillForm(getByPlaceholderText, {
      name: 'John Doe',
      email: 'test@example.com',
      password: 'Password123!',
      phone: '1234567890',
      address: '123 Street',
      dob: '2000-01-01',
      answer: 'Football'
    });

    fireEvent.click(getByText('REGISTER'));
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      })
    })
  })
})
