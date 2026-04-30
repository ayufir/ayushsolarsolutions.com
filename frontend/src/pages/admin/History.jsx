import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import Sidebar from '../../components/Sidebar';
import api from '../../utils/api';

const dotIcon = new L.DivIcon({
  className: 'custom-dot',
  html: `<div style="width: 10px; height: 10px; background-color: #eab308; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
  iconSize: [10, 10],
  iconAnchor: [5, 5]
});

const MapController = ({ locations }) => {
  const map = useMap();
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = L.latLngBounds(locations.map(loc => [loc.latitude, loc.longitude]));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);
  return null;
};

const History = () => {
  const [employees, setEmployees] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data } = await api.get('/employees');
        setEmployees(data);
        if (data.length > 0) {
          setSelectedUser(data[0]._id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!selectedUser || !selectedDate) return;
      try {
        const { data } = await api.get(`/location/history/${selectedUser}?date=${selectedDate}`);
        setHistory(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchHistory();
  }, [selectedUser, selectedDate]);

  const polylinePositions = history.map(loc => [loc.latitude, loc.longitude]);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex gap-4 items-center">
          <h1 className="text-2xl font-bold text-gray-800 mr-4">Location History</h1>
          <select 
            className="p-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
          >
            <option value="" disabled>Select Employee</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
            ))}
          </select>
          <input 
            type="date" 
            className="p-2 border border-gray-300 rounded-lg focus:ring-yellow-500 focus:border-yellow-500"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </header>

        <main className="flex-1 p-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full overflow-hidden relative">
            <MapContainer center={[20, 0]} zoom={2} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <MapController locations={history} />
              
              {polylinePositions.length > 0 && (
                <Polyline positions={polylinePositions} color="#eab308" weight={3} opacity={0.7} />
              )}
              
              {history.map((loc, idx) => (
                <Marker 
                  key={loc._id} 
                  position={[loc.latitude, loc.longitude]}
                  icon={dotIcon}
                />
              ))}
            </MapContainer>
            {history.length === 0 && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[1000]">
                <div className="text-gray-500 font-bold text-xl">No history found for this date.</div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default History;
