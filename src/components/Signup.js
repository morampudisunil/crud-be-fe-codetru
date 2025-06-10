import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    date_of_birth: '',
    mobile_number: '',
    password: '',
    is_admin: false
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuth();

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Full Name is required';
        } else if (!/^[A-Za-z\s]{2,50}$/.test(value.trim())) {
          newErrors.name = 'Please enter a valid name (letters only)';
        } else {
          delete newErrors.name;
        }
        break;

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) {
          newErrors.email = 'Email address is required';
        } else if (!emailRegex.test(value)) {
          newErrors.email = 'Enter a valid email address (e.g., user@example.com)';
        } else {
          delete newErrors.email;
        }
        break;

      case 'date_of_birth':
        if (!value) {
          newErrors.date_of_birth = 'Date of birth is required';
        } else {
          const dob = new Date(value);
          const today = new Date();
          let calculatedAge = today.getFullYear() - dob.getFullYear();
          const monthDiff = today.getMonth() - dob.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
            calculatedAge--;
          }
          
          if (dob > today) {
            newErrors.date_of_birth = 'Date of birth cannot be in the future';
          } else if (calculatedAge < 13) {
            newErrors.date_of_birth = 'Enter a valid date of birth. You must be at least 13 years old';
          } else {
            delete newErrors.date_of_birth;
          }
        }
        break;

      case 'mobile_number':
        if (!value) {
          newErrors.mobile_number = 'Mobile number is required';
        } else if (value.length === 1 && !/^[6-9]$/.test(value)) {
          newErrors.mobile_number = 'Mobile number must start with 6, 7, 8, or 9';
        } else if (value.length < 10) {
          newErrors.mobile_number = 'Please enter 10 digit mobile number';
        } else if (!/^[6-9]\d{9}$/.test(value)) {
          newErrors.mobile_number = 'Mobile number must start with 6, 7, 8, or 9';
        } else {
          delete newErrors.mobile_number;
        }
        break;

      case 'password':
        if (!value) {
          newErrors.password = 'Password is required';
        } else {
          if (value.length < 5 || value.length > 30) {
            newErrors.password = 'Password must be 5-30 characters and include uppercase, lowercase, number, and special character';
          } else if (!/(?=.*[a-z])/.test(value)) {
            newErrors.password = 'Password must contain at least one lowercase letter';
          } else if (!/(?=.*[A-Z])/.test(value)) {
            newErrors.password = 'Password must contain at least one uppercase letter';
          } else if (!/(?=.*\d)/.test(value)) {
            newErrors.password = 'Password must contain at least one number';
          } else if (!/(?=.*[!@#$%^&*])/.test(value)) {
            newErrors.password = 'Password must contain at least one special character (!@#$%^&*)';
          } else if (/\s/.test(value)) {
            newErrors.password = 'Password cannot contain spaces';
          } else {
            delete newErrors.password;
          }
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Special handling for mobile number - only allow digits starting with 6-9
    if (name === 'mobile_number') {
      // For first digit, only allow 6-9
      if (value.length === 1 && !/^[6-9]$/.test(value)) {
        return;
      }
      // For remaining digits, allow any number if first digit is valid
      if (value.length <= 10 && /^[6-9]\d*$/.test(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
        validateField(name, value);
      }
      return;
    }

    // Special handling for name - only allow letters and spaces
    if (name === 'name') {
      if (value.length <= 50 && /^[A-Za-z\s]*$/.test(value)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
        validateField(name, value);
      }
      return;
    }

    // Normal handling for other fields
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Validate the field immediately
    validateField(name, newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    Object.keys(formData).forEach(key => {
      if (key !== 'is_admin') {
        validateField(key, formData[key]);
      }
    });

    // Check if there are any errors
    if (Object.keys(errors).length > 0) {
      toast.error('Please fix all the errors in the form');
      return;
    }

    setLoading(true);
    
    // Format the data to match backend expectations
    const formattedData = {
      ...formData,
      date_of_birth: new Date(formData.date_of_birth).toISOString().split('T')[0]
    };
    
    try {
      const response = await signup(formattedData);
      if (response) {
        toast.success('Signup successful!');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Signup error details:', error.response?.data || error);
      toast.error(error.response?.data?.detail || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const getMaxDate = () => {
    const today = new Date();
    const year = today.getFullYear() - 13; // Minimum age 13
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear() - 100; // Maximum age 100
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Sign in
            </Link>
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className={`mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Enter your full name"
                value={formData.name}
                onChange={handleChange}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className={`mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            <div>
              <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
                Date of Birth <span className="text-red-500">*</span>
              </label>
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                required
                max={getMaxDate()}
                min={getMinDate()}
                className={`mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.date_of_birth ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                value={formData.date_of_birth}
                onChange={handleChange}
              />
              {errors.date_of_birth && (
                <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
              )}
            </div>
            <div>
              <label htmlFor="mobile_number" className="block text-sm font-medium text-gray-700">
                Mobile Number <span className="text-red-500">*</span>
              </label>
              <input
                id="mobile_number"
                name="mobile_number"
                type="tel"
                required
                maxLength="10"
                pattern="[0-9]*"
                inputMode="numeric"
                className={`mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.mobile_number ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Enter 10-digit mobile number"
                value={formData.mobile_number}
                onChange={handleChange}
              />
              {errors.mobile_number && (
                <p className="mt-1 text-sm text-red-600">{errors.mobile_number}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                maxLength="30"
                className={`mt-1 appearance-none rounded-md relative block w-full px-3 py-2 border ${
                  errors.password ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm`}
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Password must be 5-30 characters long and contain:
                <ul className="list-disc list-inside ml-2">
                  <li>At least one uppercase letter</li>
                  <li>At least one lowercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character (!@#$%^&*)</li>
                </ul>
              </p>
            </div>
            <div className="flex items-center">
              <input
                id="is_admin"
                name="is_admin"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                checked={formData.is_admin}
                onChange={handleChange}
              />
              <label htmlFor="is_admin" className="ml-2 block text-sm text-gray-900">
                Register as Admin
              </label>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Signup; 