import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';
import { Check, X, ClipboardList, Clock, Eye } from 'lucide-react';

const Tasks = () => {
  const [employees, setEmployees] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [formData, setFormData] = useState({ employeeId: '', title: '', description: '' });
  const [viewProof, setViewProof] = useState(null);

  const fetchData = async () => {
    try {
      const [empRes, taskRes] = await Promise.all([
        api.get('/employees'),
        api.get('/tasks/all')
      ]);
      setEmployees(empRes.data);
      setTasks(taskRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks/assign', formData);
      setFormData({ employeeId: '', title: '', description: '' });
      alert('Task assigned successfully!');
      fetchData();
    } catch (err) {
      alert('Error assigning task');
    }
  };

  const handleReview = async (taskId, status) => {
    try {
      await api.put('/tasks/review', { taskId, status });
      fetchData();
      if(viewProof) setViewProof(null);
    } catch (err) {
      alert('Error updating task');
    }
  };

  const getStatusBadge = (status) => {
    const base = "px-2 py-1 rounded text-xs font-bold uppercase ";
    switch (status) {
      case 'approved': return base + "bg-green-100 text-green-700";
      case 'rejected': return base + "bg-red-100 text-red-700";
      case 'completed': return base + "bg-yellow-100 text-yellow-700";
      default: return base + "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
          <ClipboardList className="mr-3 text-yellow-500" />
          Task Management
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Assignment Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold mb-4">Assign New Task</h2>
            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Employee</label>
                <select 
                  required className="w-full p-3 border border-gray-300 rounded-lg"
                  value={formData.employeeId} onChange={e => setFormData({...formData, employeeId: e.target.value})}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
                <input 
                  type="text" required placeholder="Repair Panel #42"
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  rows="3" placeholder="Details about the job..."
                  className="w-full p-3 border border-gray-300 rounded-lg"
                  value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-3 rounded-lg">
                Assign Task
              </button>
            </form>
          </div>

          {/* Task List */}
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tasks.map(task => (
                    <tr key={task._id}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{task.employee?.name}</div>
                        <div className="text-xs text-gray-500">{task.employee?.employeeId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{task.title}</div>
                        <div className="text-xs text-gray-500">{new Date(task.assignedAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={getStatusBadge(task.status)}>{task.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {task.status === 'completed' && (
                          <button 
                            onClick={() => setViewProof(task)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="View Proof"
                          >
                            <Eye size={18} />
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <>
                            <button onClick={() => handleReview(task._id, 'approved')} className="p-2 text-green-600 hover:bg-green-50 rounded"><Check size={18} /></button>
                            <button onClick={() => handleReview(task._id, 'rejected')} className="p-2 text-red-600 hover:bg-red-50 rounded"><X size={18} /></button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                  {tasks.length === 0 && (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No tasks assigned yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Proof Modal */}
        {viewProof && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Completion Proof</h3>
                <button onClick={() => setViewProof(null)}><X size={24} /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4 max-h-96 overflow-y-auto">
                {viewProof.proofImages?.map((img, idx) => (
                  <img 
                    key={idx}
                    src={img} 
                    alt={`Proof ${idx + 1}`} 
                    className="w-full h-40 object-cover rounded-lg border-2 border-gray-100 shadow-sm"
                  />
                ))}
              </div>
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-sm text-gray-600 font-bold mb-1">TASK: {viewProof.title}</p>
                <p className="text-xs text-gray-500">Submitted: {new Date(viewProof.submittedAt).toLocaleString()}</p>
                {viewProof.locationAtCompletion && (
                   <p className="text-xs text-gray-500 mt-1">📍 Location: {viewProof.locationAtCompletion.latitude}, {viewProof.locationAtCompletion.longitude}</p>
                )}
              </div>
              <div className="flex space-x-4">
                <button 
                  onClick={() => handleReview(viewProof._id, 'approved')}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center"
                >
                  <Check className="mr-2" /> APPROVE
                </button>
                <button 
                  onClick={() => handleReview(viewProof._id, 'rejected')}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl flex items-center justify-center"
                >
                  <X className="mr-2" /> REJECT
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
