import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { LogOut, Navigation, StopCircle } from 'lucide-react';

const Tracking = () => {
  const { user, logout } = useContext(AuthContext);
  const [tracking, setTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const watchId = useRef(null);
  const intervalId = useRef(null);
  const latestLocation = useRef(null);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setTracking(true);
    setError(null);

    // Watch position
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        latestLocation.current = { latitude, longitude };
        setLocation({ latitude, longitude });
      },
      (err) => {
        setError(`Error: ${err.message}`);
        setTracking(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 5000
      }
    );

    // Send location to server every 5 seconds
    intervalId.current = setInterval(async () => {
      if (latestLocation.current) {
        try {
          // You could get battery level using Battery Status API if supported
          let batteryLevel = null;
          if ('getBattery' in navigator) {
            const battery = await navigator.getBattery();
            batteryLevel = battery.level * 100;
          }

          const payload = {
            latitude: latestLocation.current.latitude,
            longitude: latestLocation.current.longitude,
            battery: batteryLevel,
            address: 'GPS coordinates updated' // Reverse geocoding can be done here if needed
          };
          
          await api.post('/location/update', payload);
        } catch (err) {
          console.error('Failed to update location', err);
        }
      }
    }, 5000);
  };

  const stopTracking = () => {
    setTracking(false);
    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (intervalId.current) {
      clearInterval(intervalId.current);
      intervalId.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <header className="p-4 bg-gray-800 border-b border-gray-700 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <span className="text-xl">☀️</span>
          <h1 className="font-bold text-yellow-500">SolarTrack</h1>
        </div>
        <button onClick={logout} className="text-gray-400 hover:text-white">
          <LogOut size={20} />
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">Welcome, {user?.name}</h2>
          <p className="text-gray-400">ID: {user?.employeeId}</p>
        </div>

        {error && <div className="text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20">{error}</div>}

        <div className={`w-48 h-48 rounded-full flex items-center justify-center border-4 ${tracking ? 'border-green-500 bg-green-500/10' : 'border-gray-700 bg-gray-800'} transition-colors duration-500`}>
          {tracking ? (
            <div className="animate-pulse flex flex-col items-center text-green-500">
              <Navigation size={48} />
              <span className="mt-4 font-bold tracking-widest uppercase text-sm">Tracking Active</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-500">
              <span className="mt-4 font-bold tracking-widest uppercase text-sm">Offline</span>
            </div>
          )}
        </div>

        {location && (
          <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 w-full max-w-sm">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Current Coordinates</h3>
            <p className="font-mono text-lg text-yellow-400">Lat: {location.latitude.toFixed(6)}</p>
            <p className="font-mono text-lg text-yellow-400">Lng: {location.longitude.toFixed(6)}</p>
          </div>
        )}

        <div className="w-full max-w-sm">
          {!tracking ? (
            <button 
              onClick={startTracking}
              className="w-full bg-green-500 hover:bg-green-600 text-gray-900 font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              Start My Shift & Track Location
            </button>
          ) : (
            <button 
              onClick={stopTracking}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-4 flex items-center justify-center space-x-2 rounded-xl shadow-lg transition-transform active:scale-95"
            >
              <StopCircle size={20} />
              <span>Stop Tracking</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Tracking;
