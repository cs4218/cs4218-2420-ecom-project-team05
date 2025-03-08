import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import AdminMenu from '../../components/AdminMenu';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/auth';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auth] = useAuth();

  // Fetch all users
  const getAllUsers = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/v1/auth/all-users', {
        headers: {
          Authorization: auth?.token,
        },
      });
      
      if (data?.success) {
        setUsers(data.users);
      }
      setLoading(false);
    } catch (error) {
      console.log("Error details:", error);
      console.log("Error response:", error.response?.data);
      toast.error(`Error fetching users: ${error.response?.data?.message || error.message}`);
      setLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    getAllUsers();
  }, []);

  return (
    <Layout title={"Dashboard - All Users"}>
      <div className="container-fluid m-3 p-3">
        <div className="row">
          <div className="col-md-3">
            <AdminMenu />
          </div>
          <div className="col-md-9">
            <h1 className="mb-4">All Users</h1>
            
            {loading ? (
              <div className="d-flex justify-content-center">
                <div className="spinner-border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead className="table-dark">
                    <tr>
                      <th scope="col">S.No.</th>
                      <th scope="col">Name</th>
                      <th scope="col">Email</th>
                      <th scope="col">Phone</th>
                      <th scope="col">Address</th>
                      <th scope="col">Role</th>
                      <th scope="col">Registered On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((user, index) => (
                        <tr key={user._id}>
                          <td>{index + 1}</td>
                          <td>{user.name}</td>
                          <td>{user.email}</td>
                          <td>{user.phone || 'N/A'}</td>
                          <td>{user.address || 'N/A'}</td>
                          <td>
                            <span className={`badge ${user.role === 1 ? 'bg-success' : 'bg-primary'}`}>
                              {user.role === 1 ? 'Admin' : 'User'}
                            </span>
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Users;
