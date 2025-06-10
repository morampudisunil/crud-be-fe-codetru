import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const Dashboard = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [showUsers, setShowUsers] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    date_of_birth: user?.date_of_birth || '',
    mobile_number: user?.mobile_number || ''
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        date_of_birth: user.date_of_birth || '',
        mobile_number: user.mobile_number || ''
      });
    }
  }, [user]);

  const getMaxDate = () => {
    const today = new Date();
    const year = today.getFullYear() - 13;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getMinDate = () => {
    const today = new Date();
    const year = today.getFullYear() - 100;
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
        } else if (value.length < 10) {
          newErrors.mobile_number = 'Please enter 10 digit mobile number';
        } else if (!/^\d{10}$/.test(value)) {
          newErrors.mobile_number = 'Please enter a valid 10-digit mobile number';
        } else {
          delete newErrors.mobile_number;
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'mobile_number') {
      if (value.length <= 10 && /^\d*$/.test(value)) {
        setFormData(prev => {
          const newData = {
            ...prev,
            [name]: value
          };
          return newData;
        });
        validateField(name, value);
      }
      return;
    }

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

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    validateField(name, value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    Object.keys(formData).forEach(key => {
      validateField(key, formData[key]);
    });

    if (Object.keys(errors).length > 0) {
      toast.error('Please fix all the errors in the form');
      return;
    }

    try {
      setLoading(true);
      const response = await updateProfile(formData);
      if (response) {
        toast.success('Profile updated successfully!');
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Profile update error:', error.response?.data || error);
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully!');
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/users', {
        headers: {
          'Authorization': `Bearer ${user.jwt}`
        }
      });
      setUsers(response.data);
      setShowUsers(true);
    } catch (error) {
      toast.error('Failed to fetch users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHideUsers = () => {
    setShowUsers(false);
    setUsers([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user.is_admin && (
                <button
                  onClick={showUsers ? handleHideUsers : fetchUsers}
                  className={`px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                    showUsers ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {showUsers ? 'Hide Users' : 'Show Registered Users'}
                </button>
              )}
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {showUsers && user.is_admin && (
          <div className="px-4 py-6 sm:px-0 mb-6">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Registered Users</h2>
                <button
                  onClick={handleHideUsers}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                >
                  Hide Table
                </button>
              </div>
              {loading ? (
                <div className="text-center">Loading users...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date of Birth</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mobile Number</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((userData) => (
                        <tr key={userData.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{userData.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{userData.email}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{userData.date_of_birth}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{userData.mobile_number}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{userData.is_admin ? 'Admin' : 'User'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {!showUsers && (
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className={`mt-1 block w-full border ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`mt-1 block w-full border ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleChange}
                      max={getMaxDate()}
                      min={getMinDate()}
                      className={`mt-1 block w-full border ${
                        errors.date_of_birth ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                    />
                    {errors.date_of_birth && (
                      <p className="mt-1 text-sm text-red-600">{errors.date_of_birth}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
                    <input
                      type="tel"
                      name="mobile_number"
                      value={formData.mobile_number}
                      onChange={handleChange}
                      maxLength="10"
                      pattern="[0-9]*"
                      inputMode="numeric"
                      className={`mt-1 block w-full border ${
                        errors.mobile_number ? 'border-red-300' : 'border-gray-300'
                      } rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                      placeholder="Enter 10-digit mobile number"
                    />
                    {errors.mobile_number && (
                      <p className="mt-1 text-sm text-red-600">{errors.mobile_number}</p>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Name</h3>
                    <p className="mt-1 text-sm text-gray-900">{user.name}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Email</h3>
                    <p className="mt-1 text-sm text-gray-900">{user.email}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Date of Birth</h3>
                    <p className="mt-1 text-sm text-gray-900">{user.date_of_birth}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Mobile Number</h3>
                    <p className="mt-1 text-sm text-gray-900">{user.mobile_number}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Role</h3>
                    <p className="mt-1 text-sm text-gray-900">{user.is_admin ? 'Admin' : 'User'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard; 