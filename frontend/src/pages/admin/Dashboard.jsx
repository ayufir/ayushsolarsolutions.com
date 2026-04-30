import React, { useState, useEffect, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { Battery, UserIcon, Clock, ClipboardPlus, X } from 'lucide-react';

// Employee Icon
const employeeIcon = new L.DivIcon({
  className: 'custom-icon',
  html: `<div style="font-size: 24px; filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.3));">👷‍♂️</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Solar Panel Asset Icon
const solarPanelIcon = new L.DivIcon({
  className: 'custom-icon',
  html: `<div style="font-size: 24px; filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.3));">☀️</div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Admin's Own Location Icon
const adminIcon = new L.DivIcon({
  className: 'custom-icon-admin',
  html: `<div style="width: 16px; height: 16px; background-color: #3b82f6; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 8px rgba(0,0,0,0.5);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const MapController = ({ locations, focusedLocation, adminLocation }) => {
  const map = useMap();
  const [initialCentered, setInitialCentered] = useState(false);

  useEffect(() => {
    if (focusedLocation) {
      map.flyTo([focusedLocation.latitude, focusedLocation.longitude], 16, { animate: true });
    } else if (adminLocation && !initialCentered) {
      // First time map loads and we get admin location, center there
      map.flyTo([adminLocation.latitude, adminLocation.longitude], 14, { animate: true });
      setInitialCentered(true);
    } else if (locations.length > 0 && !focusedLocation && initialCentered) {
      // When "Show All" is clicked or locations update
      const bounds = L.latLngBounds(locations.map(loc => [loc.latitude, loc.longitude]));
      if (adminLocation) bounds.extend([adminLocation.latitude, adminLocation.longitude]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, focusedLocation, adminLocation, map, initialCentered]);
  return null;
};

const MapClickHandler = ({ onMapClick }) => {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    }
  });
  return null;
};

const Dashboard = () => {
  const [locations, setLocations] = useState([]);
  const [solars, setSolars] = useState([]);
  const [focusedLocation, setFocusedLocation] = useState(null);
  const [adminLocation, setAdminLocation] = useState(null);
  const [socket, setSocket] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [assigningTask, setAssigningTask] = useState(null); // stores the solar object being serviced
  const [taskForm, setTaskForm] = useState({ employeeId: '', description: '' });
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Get Admin's current physical location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAdminLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      (err) => console.log('Admin location error:', err),
      { enableHighAccuracy: true }
    );
    // Fetch initial live locations
    const fetchLocations = async () => {
      try {
        const { data } = await api.get('/location/live');
        setLocations(data);
      } catch (err) {
        console.error('Error fetching live locations', err);
      }
    };
    const fetchSolars = async () => {
      try {
        const { data } = await api.get('/solars');
        setSolars(data);
      } catch (err) {
        console.error('Error fetching solars', err);
      }
    };
    const fetchEmployees = async () => {
      try {
        const { data } = await api.get('/employees');
        setEmployees(data);
      } catch (err) {
        console.error('Error fetching employees', err);
      }
    };
    fetchLocations();
    fetchSolars();
    fetchEmployees();

    // Setup Socket.IO
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    newSocket.on('connect', () => {
      newSocket.emit('join_admin');
    });

    // Actually, in our backend, the employee posts location to API. 
    // Wait, let's just make the backend emit to socket when location is updated via API.
    // I need to update the backend location controller to emit, but for now I can also just poll every 5 seconds.
    // For pure real-time, the socket approach is better.
    const pollInterval = setInterval(fetchLocations, 5000);

    return () => {
      newSocket.close();
      clearInterval(pollInterval);
    };
  }, []);

  const handleMapClick = async (latlng) => {
    const name = window.prompt("Mark new Solar Panel location. Enter Panel Name or ID:");
    if (name && name.trim() !== '') {
      try {
        const { data } = await api.post('/solars', {
          name,
          latitude: latlng.lat,
          longitude: latlng.lng
        });
        setSolars([...solars, data]);
      } catch (err) {
        alert("Error adding solar panel: " + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!taskForm.employeeId) return alert('Please select an employee');
    try {
      await api.post('/tasks/assign', {
        employeeId: taskForm.employeeId,
        title: `Service: ${assigningTask.name}`,
        description: taskForm.description || `Required service at ${assigningTask.name} site.`
      });
      alert('Task assigned successfully!');
      setAssigningTask(null);
      setTaskForm({ employeeId: '', description: '' });
    } catch (err) {
      alert('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Live Operations Dashboard</h1>
          <div className="text-sm text-gray-500">Admin: {user?.name}</div>
        </header>

        <main className="flex-1 p-4 flex gap-4">
          {/* Main Map Area */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
            <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <MapController locations={locations} focusedLocation={focusedLocation} adminLocation={adminLocation} />
              <MapClickHandler onMapClick={handleMapClick} />
              
              {/* Render Admin Location Marker */}
              {adminLocation && (
                <Marker position={[adminLocation.latitude, adminLocation.longitude]} icon={adminIcon}>
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-blue-600">You Are Here</h3>
                      <p className="text-sm text-gray-500">Admin Dashboard Location</p>
                    </div>
                  </Popup>
                </Marker>
              )}
              
              {locations.map((loc) => (
                <Marker 
                  key={loc._id} 
                  position={[loc.latitude, loc.longitude]}
                  icon={employeeIcon}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold text-lg border-b pb-2 mb-2">{loc.user.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2">
                          <UserIcon size={16} className="text-gray-500" />
                          <span>ID: {loc.user.employeeId}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Battery size={16} className="text-gray-500" />
                          <span>Battery: {loc.battery ? `${loc.battery.toFixed(0)}%` : 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock size={16} className="text-gray-500" />
                          <span>Last Updated: {new Date(loc.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <div className="mt-2 pt-2 border-t">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                            new Date() - new Date(loc.timestamp) < 60000 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {new Date() - new Date(loc.timestamp) < 60000 ? 'Online' : 'Offline'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Render Solar Panels */}
              {solars.map((solar) => (
                <Marker 
                  key={solar._id} 
                  position={[solar.latitude, solar.longitude]}
                  icon={solarPanelIcon}
                >
                  <Popup>
                    <div className="p-2">
                      <h3 className="font-bold text-yellow-600">{solar.name}</h3>
                      <p className="text-sm text-gray-500 mb-2">Solar Asset Installed</p>
                      <button 
                        onClick={() => setAssigningTask(solar)}
                        className="w-full flex items-center justify-center space-x-1 bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1.5 rounded text-xs font-bold"
                      >
                        <ClipboardPlus size={14} />
                        <span>Assign Service</span>
                      </button>
                      <p className="text-[10px] text-gray-400 mt-2">Added: {new Date(solar.createdAt).toLocaleDateString()}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Sidebar Employee List */}
          <div className="w-80 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50 rounded-t-xl flex justify-between items-center">
              <h2 className="font-bold text-gray-800">Active Field Team</h2>
              {focusedLocation && (
                <button onClick={() => setFocusedLocation(null)} className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1 rounded">Show All</button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {locations.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">No active tracking data</div>
              )}
              {locations.map((loc) => {
                const isOnline = new Date() - new Date(loc.timestamp) < 60000; // less than 1 min
                return (
                  <div key={loc._id} onClick={() => setFocusedLocation(loc)} className={`p-3 rounded-lg border cursor-pointer transition-colors ${focusedLocation?._id === loc._id ? 'bg-yellow-50 border-yellow-400' : 'bg-gray-50 border-gray-100 hover:border-yellow-400'}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-800">{loc.user.name}</h3>
                      <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p>ID: {loc.user.employeeId}</p>
                      <p>Updated: {new Date(loc.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      {/* Task Assignment Modal */}
      {assigningTask && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[2000] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-yellow-500 p-4 flex justify-between items-center text-white">
              <h3 className="font-bold text-lg flex items-center">
                <ClipboardPlus className="mr-2" /> Assign Service Task
              </h3>
              <button onClick={() => setAssigningTask(null)}><X size={24} /></button>
            </div>
            <form onSubmit={handleAssignTask} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Target Site</label>
                <div className="p-3 bg-gray-50 rounded-lg text-gray-800 font-medium border border-gray-200">☀️ {assigningTask.name}</div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Assign To Employee</label>
                <select 
                  required className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                  value={taskForm.employeeId} onChange={e => setTaskForm({...taskForm, employeeId: e.target.value})}
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Special Instructions (Optional)</label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                  rows="3" placeholder="Ex: Clean panels or check wiring..."
                  value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})}
                ></textarea>
              </div>
              <button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95">
                SEND TASK TO EMPLOYEE
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
