import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';
import { Plus, Trash2, Edit2 } from 'lucide-react';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({ name: '', employeeId: '', email: '', password: '' });
  const [editingId, setEditingId] = useState(null);

  const fetchEmployees = async () => {
    try {
      const { data } = await api.get('/employees');
      setEmployees(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/employees/${editingId}`, formData);
      } else {
        await api.post('/employees', formData);
      }
      setFormData({ name: '', employeeId: '', email: '', password: '' });
      setEditingId(null);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving employee');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await api.delete(`/employees/${id}`);
        fetchEmployees();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleEdit = (emp) => {
    setFormData({ name: emp.name, employeeId: emp.employeeId, email: emp.email, password: '' });
    setEditingId(emp._id);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Employees</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Employee' : 'Add New Employee'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" placeholder="Full Name" required 
              className="p-3 border border-gray-300 rounded-lg"
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
            />
            <input 
              type="text" placeholder="Employee ID (e.g. EMP001)" required 
              className="p-3 border border-gray-300 rounded-lg"
              value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}
            />
            <input 
              type="email" placeholder="Email Address" required 
              className="p-3 border border-gray-300 rounded-lg"
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
            />
            <input 
              type="password" placeholder={editingId ? "New Password (optional)" : "Password"} required={!editingId}
              className="p-3 border border-gray-300 rounded-lg"
              value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
            />
            <div className="md:col-span-2 flex justify-end">
              {editingId && (
                <button type="button" onClick={() => {setEditingId(null); setFormData({name:'', employeeId:'', email:'', password:''})}} className="mr-4 text-gray-500 hover:text-gray-700">Cancel</button>
              )}
              <button type="submit" className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 px-6 rounded-lg flex items-center space-x-2">
                <Plus size={20} />
                <span>{editingId ? 'Update Employee' : 'Add Employee'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Employee ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map(emp => (
                <tr key={emp._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{emp.employeeId}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{emp.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => handleEdit(emp)} className="text-blue-600 hover:text-blue-900 mr-4">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDelete(emp._id)} className="text-red-600 hover:text-red-900">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No employees found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Employees;
