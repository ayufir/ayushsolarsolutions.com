import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { MapIcon, Users, HistoryIcon, LogOut } from 'lucide-react';

const Sidebar = () => {
  const { logout } = useContext(AuthContext);

  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="p-4 text-2xl font-bold text-yellow-500 border-b border-gray-800">
        SolarTrack
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <NavLink 
          to="/admin/dashboard" 
          className={({isActive}) => `flex items-center space-x-3 p-3 rounded-lg ${isActive ? 'bg-gray-800 text-yellow-400' : 'hover:bg-gray-800'}`}
        >
          <MapIcon size={20} />
          <span>Live Map</span>
        </NavLink>
        <NavLink 
          to="/admin/employees" 
          className={({isActive}) => `flex items-center space-x-3 p-3 rounded-lg ${isActive ? 'bg-gray-800 text-yellow-400' : 'hover:bg-gray-800'}`}
        >
          <Users size={20} />
          <span>Employees</span>
        </NavLink>
        <NavLink 
          to="/admin/history" 
          className={({isActive}) => `flex items-center space-x-3 p-3 rounded-lg ${isActive ? 'bg-gray-800 text-yellow-400' : 'hover:bg-gray-800'}`}
        >
          <HistoryIcon size={20} />
          <span>Location History</span>
        </NavLink>
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button 
          onClick={logout} 
          className="flex items-center space-x-3 text-gray-400 hover:text-white w-full p-3 rounded-lg hover:bg-red-600 transition-colors"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
