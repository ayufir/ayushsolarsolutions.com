import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, Animated, Platform, ScrollView
} from 'react-native';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import * as ImagePicker from 'expo-image-picker';

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API_URL = 'http://192.168.1.12:5000/api';
axios.defaults.headers.common['bypass-tunnel-reminder'] = 'true';

// ─── SOLAR SITES TAB ──────────────────────────────────────────────────────────
function SolarTab({ token }: { token: string }) {
  const webViewRef = useRef<any>(null);
  const [solars, setSolars] = useState<any[]>([]);
  const [mapReady, setMapReady] = useState(false);
  const [solarsFetched, setSolarsFetched] = useState(false);
  const injected = useRef(false);

  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_URL}/solars`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => { setSolars(res.data); setSolarsFetched(true); })
      .catch(() => { setSolarsFetched(true); }); // mark fetched even on error
  }, [token]);

  // Inject ONLY when BOTH map is ready AND solars fetch is done
  useEffect(() => {
    if (!mapReady || !solarsFetched || !webViewRef.current || injected.current) return;
    injected.current = true;
    setTimeout(() => {
      webViewRef.current?.injectJavaScript(
        `window.loadSolars(${JSON.stringify(solars)}); true;`
      );
    }, 600);
  }, [mapReady, solarsFetched]);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{height:100%;width:100%;background:#0f172a}
    .leaflet-control-attribution{display:none}
    .si{font-size:28px;text-align:center;line-height:36px}
    #ld{position:fixed;inset:0;background:#0f172a;display:flex;flex-direction:column;
        justify-content:center;align-items:center;z-index:9999;transition:opacity .4s}
    .sp{width:48px;height:48px;border:5px solid #1e293b;border-top:5px solid #f59e0b;
        border-radius:50%;animation:rot .9s linear infinite}
    @keyframes rot{to{transform:rotate(360deg)}}
    .lt{color:#94a3b8;margin-top:12px;font-family:sans-serif;font-size:13px;letter-spacing:1px}
    #empty{position:fixed;inset:0;display:none;flex-direction:column;justify-content:center;
           align-items:center;z-index:9998;background:#0f172a}
    .etxt{color:#64748b;font-family:sans-serif;font-size:16px;margin-top:16px;letter-spacing:1px}
    .esub{color:#334155;font-family:sans-serif;font-size:12px;margin-top:6px}
  </style>
</head>
<body>
  <div id="ld"><div class="sp"></div><div class="lt">LOADING SOLAR SITES...</div></div>
  <div id="empty">
    <div style="font-size:48px">☀️</div>
    <div class="etxt">NO SOLAR SITES YET</div>
    <div class="esub">Admin has not marked any solar panels</div>
  </div>
  <div id="map"></div>
  <script>
    var map=L.map('map',{zoomControl:false}).setView([20,0],3);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

    var SI=L.divIcon({className:'si',html:'&#x2600;&#xFE0F;',iconSize:[36,36],iconAnchor:[18,18]});
    var markers=[];
    var currentTour=-1;

    function tourNext(){
      if(markers.length===0) return;
      currentTour=(currentTour+1)%markers.length;
      var m=markers[currentTour];
      map.flyTo(m.getLatLng(),17,{animate:true,duration:1.4});
      setTimeout(function(){ m.openPopup(); },1500);
    }

    // Tour button
    var TourCtrl=L.Control.extend({
      options:{position:'bottomright'},
      onAdd:function(){
        var btn=L.DomUtil.create('button');
        btn.innerHTML='&#9654; Tour Sites';
        btn.style.cssText='background:#f59e0b;color:#0f172a;border:none;padding:10px 18px;border-radius:10px;font-weight:900;font-size:14px;cursor:pointer;letter-spacing:1px;box-shadow:0 4px 12px rgba(245,158,11,0.4)';
        L.DomEvent.on(btn,'click',function(e){
          L.DomEvent.stopPropagation(e);
          tourNext();
        });
        return btn;
      }
    });
    new TourCtrl().addTo(map);

    window.loadSolars=function(arr){
      var ld=document.getElementById('ld');
      var empty=document.getElementById('empty');
      if(ld) ld.style.display='none';

      if(!arr || arr.length===0){
        if(empty) empty.style.display='flex';
        return;
      }

      var bounds=L.latLngBounds();
      arr.forEach(function(s,i){
        var popup=
          '<div style="font-family:sans-serif;padding:10px 6px;min-width:170px">'+
          '<div style="font-size:22px;text-align:center">&#9728;</div>'+
          '<div style="text-align:center;font-weight:900;color:#d97706;font-size:16px;margin-top:4px">'+s.name+'</div>'+
          '<div style="text-align:center;color:#999;font-size:12px;margin-top:2px">Solar Panel Site #'+(i+1)+'</div>'+
          '<div style="margin-top:8px;background:#f8fafc;border-radius:6px;padding:6px">'+
          '<div style="color:#64748b;font-size:11px">&#128205; Lat: '+s.latitude.toFixed(5)+'</div>'+
          '<div style="color:#64748b;font-size:11px">&#128205; Lng: '+s.longitude.toFixed(5)+'</div>'+
          '<div style="color:#64748b;font-size:11px">&#128197; Added: '+new Date(s.createdAt).toLocaleDateString()+'</div>'+
          '</div></div>';
        var m=L.marker([s.latitude,s.longitude],{icon:SI})
          .bindPopup(popup,{maxWidth:200})
          .addTo(map);
        markers.push(m);
        bounds.extend([s.latitude,s.longitude]);
      });

      // Auto fly: first fitBounds to see all, then start tour
      if(bounds.isValid()){
        map.fitBounds(bounds,{padding:[60,60],maxZoom:14,animate:true});
        // Auto start tour after 1.5s
        setTimeout(function(){ tourNext(); },1500);
      }
    };

    setTimeout(function(){
      var ld=document.getElementById('ld');
      if(ld) ld.style.display='none';
    },8000);
  </script>
</body>
</html>`;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={{ flex: 1 }}
        scrollEnabled={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        onLoad={() => setMapReady(true)}
      />
    </View>
  );
}

// ─── MAP TAB ─────────────────────────────────────────────────────────────────

function MapTab({ token }: { token: string }) {
  const webViewRef = useRef<any>(null);
  const [mapReady, setMapReady] = useState(false);
  const pendingSolars = useRef<any[]>([]);
  const pendingLoc = useRef<{ lat: number; lng: number } | null>(null);

  // 1️⃣  Fetch solar panels once map is ready (or queue them)
  useEffect(() => {
    if (!token) return;
    axios
      .get(`${API_URL}/solars`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        const data: any[] = res.data;
        if (!data.length) return;
        if (mapReady && webViewRef.current) {
          webViewRef.current.injectJavaScript(
            `window.addSolars(${JSON.stringify(data)}); true;`
          );
        } else {
          pendingSolars.current = data;
        }
      })
      .catch(() => {});
  }, [token, mapReady]);

  // 2️⃣  Get current GPS once (instant center)
  useEffect(() => {
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
      .then(loc => {
        const { latitude: lat, longitude: lng } = loc.coords;
        if (mapReady && webViewRef.current) {
          webViewRef.current.injectJavaScript(
            `window.updateLocation(${lat}, ${lng}); true;`
          );
        } else {
          pendingLoc.current = { lat, lng };
        }
      })
      .catch(() => {});
  }, [mapReady]);

  // 3️⃣  Watch position every 4 seconds
  useEffect(() => {
    let sub: any;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 3 },
      loc => {
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(
            `window.updateLocation(${loc.coords.latitude}, ${loc.coords.longitude}); true;`
          );
        }
      }
    ).then(s => (sub = s));
    return () => { if (sub) sub.remove(); };
  }, []);

  // 4️⃣  On WebView load — flush pending data
  const onLoad = () => {
    setMapReady(true);

    // Inject solars first (400 ms delay so Leaflet fully boots)
    if (pendingSolars.current.length) {
      const s = JSON.stringify(pendingSolars.current);
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(`window.addSolars(${s}); true;`);
      }, 400);
      pendingSolars.current = [];
    }

    // Then inject location
    if (pendingLoc.current) {
      const { lat, lng } = pendingLoc.current;
      setTimeout(() => {
        webViewRef.current?.injectJavaScript(
          `window.updateLocation(${lat}, ${lng}); true;`
        );
      }, 800);
      pendingLoc.current = null;
    }
  };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body,#map{height:100%;width:100%;background:#0f172a}
    .leaflet-control-attribution{display:none}
    .si{font-size:26px;text-align:center;line-height:34px}
    .ei{font-size:26px;text-align:center;line-height:34px}
    #ld{position:fixed;inset:0;background:#0f172a;display:flex;flex-direction:column;
        justify-content:center;align-items:center;z-index:9999}
    .sp{width:52px;height:52px;border:5px solid #1e293b;border-top:5px solid #f59e0b;
        border-radius:50%;animation:rot .9s linear infinite}
    @keyframes rot{to{transform:rotate(360deg)}}
    .lt{color:#94a3b8;margin-top:14px;font-family:sans-serif;font-size:13px;letter-spacing:1px}
  </style>
</head>
<body>
  <div id="ld"><div class="sp"></div><div class="lt">LOADING MAP...</div></div>
  <div id="map"></div>
  <script>
    var map=L.map('map',{zoomControl:false}).setView([20,0],2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);

    var SI=L.divIcon({className:'si',html:'&#x2600;&#xFE0F;',iconSize:[34,34],iconAnchor:[17,17]});
    var EI=L.divIcon({className:'ei',html:'&#x1F477;',iconSize:[34,34],iconAnchor:[17,17]});

    var allSolars=[]; var emp=null; var first=true;

    window.addSolars=function(arr){
      allSolars=arr;
      arr.forEach(function(s){
        L.marker([s.latitude,s.longitude],{icon:SI})
          .bindPopup('<div style="font-family:sans-serif;padding:6px"><b style="color:#d97706">&#9728; '+s.name+'</b><br><small style="color:#999">Solar Panel Asset</small></div>')
          .addTo(map);
      });
      // If no employee yet, fit to solars
      if(first && arr.length){
        var b=L.latLngBounds();
        arr.forEach(function(s){b.extend([s.latitude,s.longitude]);});
        map.fitBounds(b,{padding:[55,55],maxZoom:13});
      }
    };

    window.updateLocation=function(lat,lng){
      document.getElementById('ld').style.display='none';
      if(!emp){
        emp=L.marker([lat,lng],{icon:EI})
          .bindPopup('<div style="font-family:sans-serif;padding:6px"><b style="color:#2563eb">&#128119; You Are Here</b><br><small style="color:#999">Live · Field Operative</small></div>')
          .addTo(map);
      } else {
        emp.setLatLng([lat,lng]);
      }
      if(first){
        first=false;
        map.flyTo([lat,lng],16,{animate:true,duration:1.2});
        setTimeout(function(){
          var b=L.latLngBounds([[lat,lng]]);
          allSolars.forEach(function(s){b.extend([s.latitude,s.longitude]);});
          if(b.isValid()) map.fitBounds(b,{padding:[55,55],maxZoom:15,animate:true});
        },1800);
      }
    };

    // Hide loader after 8s fallback
    setTimeout(function(){
      document.getElementById('ld').style.display='none';
      if(first && allSolars.length){
        var b=L.latLngBounds();
        allSolars.forEach(function(s){b.extend([s.latitude,s.longitude]);});
        map.fitBounds(b,{padding:[55,55],maxZoom:12});
      }
    },8000);
  </script>
</body>
</html>`;

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={{ flex: 1 }}
        scrollEnabled={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        onLoad={onLoad}
      />
    </View>
  );
}

// ─── DASHBOARD TAB ────────────────────────────────────────────────────────────
function DashboardTab({ currentLoc }: { currentLoc: any }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.3, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1.0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <ScrollView contentContainerStyle={db.scroll} style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Status Card */}
      <View style={db.card}>
        <View style={db.cardHeader}>
          <FontAwesome5 name="solar-panel" size={22} color="#f59e0b" />
          <Text style={db.cardTitle}>Field Operative Status</Text>
        </View>
        <View style={db.radarWrap}>
          <Animated.View style={[db.radarRing, { transform: [{ scale: pulse }] }]} />
          <View style={db.radarCore}>
            <Feather name="navigation" size={28} color="#fff" />
          </View>
        </View>
        <View style={db.badgeGreen}>
          <View style={db.dotGreen} />
          <Text style={db.badgeText}>TRANSMITTING LIVE LOCATION</Text>
        </View>
      </View>

      {/* Coordinates Card */}
      <View style={db.card}>
        <View style={db.cardHeader}>
          <Feather name="map-pin" size={20} color="#6366f1" />
          <Text style={db.cardTitle}>Current Coordinates</Text>
        </View>
        <View style={db.row}>
          <View style={db.coordBox}>
            <Text style={db.coordLabel}>LATITUDE</Text>
            <Text style={db.coordVal}>{currentLoc ? currentLoc.latitude.toFixed(6) : '---'}</Text>
          </View>
          <View style={db.coordBox}>
            <Text style={db.coordLabel}>LONGITUDE</Text>
            <Text style={db.coordVal}>{currentLoc ? currentLoc.longitude.toFixed(6) : '---'}</Text>
          </View>
        </View>
        {currentLoc?.accuracy != null && (
          <View style={db.accRow}>
            <Feather name="crosshair" size={14} color="#94a3b8" />
            <Text style={db.accText}>Accuracy ±{currentLoc.accuracy.toFixed(0)} m</Text>
          </View>
        )}
      </View>

      {/* Info Card */}
      <View style={db.card}>
        <View style={db.cardHeader}>
          <Feather name="shield" size={20} color="#10b981" />
          <Text style={db.cardTitle}>Security Notice</Text>
        </View>
        <Text style={db.infoText}>
          Your GPS is transmitted to HQ every 4 seconds. Keep this app open to ensure continuous tracking.
        </Text>
      </View>
    </ScrollView>
  );
}

const db = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 32 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  cardTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 16, marginLeft: 10 },
  radarWrap: { alignItems: 'center', justifyContent: 'center', height: 120, marginBottom: 16 },
  radarRing: { position: 'absolute', width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: 'rgba(16,185,129,0.5)', backgroundColor: 'rgba(16,185,129,0.1)' },
  radarCore: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  badgeGreen: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16,185,129,0.1)', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 8 },
  dotGreen: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10b981', marginRight: 8 },
  badgeText: { color: '#10b981', fontWeight: '700', fontSize: 13, letterSpacing: 1 },
  row: { flexDirection: 'row', gap: 12 },
  coordBox: { flex: 1, backgroundColor: '#0f172a', borderRadius: 10, padding: 12 },
  coordLabel: { color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  coordVal: { color: '#f8fafc', fontWeight: '700', fontSize: 14 },
  accRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  accText: { color: '#94a3b8', fontSize: 12, marginLeft: 6 },
  infoText: { color: '#94a3b8', lineHeight: 20, fontSize: 13 },
});

// ─── TASKS TAB ──────────────────────────────────────────────────────────────
function TaskTab({ token, currentLoc }: { token: string; currentLoc: any }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [userName, setUserName] = useState('');
  
  // State for multiple images during capture
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [tempImages, setTempImages] = useState<string[]>([]);

  const fetchTasks = async () => {
    if (!token) return;
    try {
      setRefreshing(true);
      const res = await axios.get(`${API_URL}/tasks/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
      const userData = await AsyncStorage.getItem('user');
      if (userData) setUserName(JSON.parse(userData).name);
    } catch (err: any) {
      console.log('Fetch tasks error:', err.message);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchTasks(); }, [token]);

  const handleCapture = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Need camera access.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.4,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0].base64) {
      setTempImages([...tempImages, `data:image/jpeg;base64,${result.assets[0].base64}`]);
    }
  };

  const submitAllProofs = async () => {
    if (tempImages.length === 0) return;
    try {
      setRefreshing(true);
      const locData = currentLoc ? {
        latitude: currentLoc.latitude,
        longitude: currentLoc.longitude
      } : { latitude: 0, longitude: 0 };

      await axios.post(`${API_URL}/tasks/submit`, {
        taskId: activeTaskId,
        proofImages: tempImages,
        location: locData
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      Alert.alert('Success', `${tempImages.length} images submitted!`);
      setTempImages([]);
      setActiveTaskId(null);
      fetchTasks();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to submit proof');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'completed': return '#f59e0b';
      default: return '#64748b';
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      style={{ flex: 1, backgroundColor: '#0f172a' }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <View>
          <Text style={{ color: '#f8fafc', fontSize: 24, fontWeight: '900' }}>Your Tasks</Text>
          <Text style={{ color: '#f59e0b', fontSize: 12, fontWeight: '600' }}>Logged as: {userName || '...'}</Text>
        </View>
        <TouchableOpacity onPress={fetchTasks} disabled={refreshing}>
          <Feather name="refresh-cw" size={20} color={refreshing ? "#1e293b" : "#f59e0b"} />
        </TouchableOpacity>
      </View>

      {tasks.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 60 }}>
          <Ionicons name="clipboard-outline" size={64} color="#1e293b" />
          <Text style={{ color: '#64748b', marginTop: 16 }}>No tasks assigned to you</Text>
        </View>
      ) : (
        tasks.map((task) => (
          <View key={task._id} style={db.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
              <Text style={{ color: '#f8fafc', fontSize: 18, fontWeight: '700' }}>{task.title}</Text>
              <View style={{ 
                backgroundColor: `${getStatusColor(task.status)}20`, 
                paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: getStatusColor(task.status)
              }}>
                <Text style={{ color: getStatusColor(task.status), fontSize: 10, fontWeight: '900', textTransform: 'uppercase' }}>
                  {task.status}
                </Text>
              </View>
            </View>
            
            <Text style={{ color: '#94a3b8', fontSize: 14, marginBottom: 16 }}>{task.description}</Text>

            {task.status === 'pending' || task.status === 'rejected' ? (
              <View>
                {activeTaskId === task._id ? (
                  <View>
                    {/* Previews */}
                    <ScrollView horizontal style={{ marginBottom: 12 }}>
                      {tempImages.map((img, idx) => (
                        <View key={idx} style={{ marginRight: 8, position: 'relative' }}>
                          <View style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', borderWeight: 1, borderColor: '#f59e0b' }}>
                            <Image style={{ width: '100%', height: '100%' }} source={{ uri: img }} />
                          </View>
                          <TouchableOpacity 
                            onPress={() => setTempImages(tempImages.filter((_, i) => i !== idx))}
                            style={{ position: 'absolute', top: -5, right: -5, backgroundColor: '#ef4444', borderRadius: 10, padding: 2 }}
                          >
                            <Feather name="x" size={12} color="white" />
                          </TouchableOpacity>
                        </View>
                      ))}
                      <TouchableOpacity 
                        onPress={handleCapture}
                        style={{ width: 60, height: 60, borderRadius: 8, borderStyle: 'dashed', borderWidth: 1, borderColor: '#64748b', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Feather name="plus" size={24} color="#64748b" />
                      </TouchableOpacity>
                    </ScrollView>

                    <View style={{ flexDirection: 'row', gap: 10 }}>
                       <TouchableOpacity 
                        style={[s.loginBtn, { flex: 1, marginTop: 0, height: 48, backgroundColor: '#10b981' }]} 
                        onPress={submitAllProofs}
                        disabled={tempImages.length === 0}
                      >
                        <Text style={s.loginBtnText}>SUBMIT ({tempImages.length})</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[s.loginBtn, { width: 50, marginTop: 0, height: 48, backgroundColor: '#334155' }]} 
                        onPress={() => {setActiveTaskId(null); setTempImages([]);}}
                      >
                        <Feather name="trash-2" size={18} color="white" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity 
                    style={[s.loginBtn, { marginTop: 0, height: 48 }]} 
                    onPress={() => setActiveTaskId(task._id)}
                  >
                    <Feather name="camera" size={18} color="#0f172a" style={{ marginRight: 8 }} />
                    <Text style={s.loginBtnText}>START PROOF</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', padding: 10, borderRadius: 8 }}>
                <Feather name="check-circle" size={16} color="#10b981" />
                <Text style={{ color: '#10b981', marginLeft: 8, fontSize: 12, fontWeight: '600' }}>
                  {task.proofImages?.length} images submitted on {new Date(task.submittedAt).toLocaleDateString()}
                </Text>
              </View>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}
// Add simple Image component import if not present
import { Image } from 'react-native';

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'map' | 'dashboard' | 'solars' | 'tasks'>('map');
  const [currentLoc, setCurrentLoc] = useState<any>(null);

  // Check for stored session
  useEffect(() => {
    AsyncStorage.getItem('userToken').then(t => {
      if (t) {
        setToken(t);
        requestLocationPermission();
      }
      setLoading(false);
    });
  }, []);

  // Start foreground watcher once logged in (for Dashboard coordinates)
  useEffect(() => {
    if (!token) return;
    let sub: any;
    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 3 },
      loc => setCurrentLoc(loc.coords)
    ).then(s => (sub = s));
    return () => { if (sub) sub.remove(); };
  }, [token]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') Alert.alert('Permission needed', 'Please allow location access.');
  };

  const handleLogin = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (res.data.role === 'employee') {
        await AsyncStorage.setItem('userToken', res.data.token);
        setToken(res.data.token);
        await requestLocationPermission();
      } else {
        Alert.alert('Error', 'Only employees can log in here.');
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Background send loop (foreground only — works in Expo Go)
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        await axios.post(
          `${API_URL}/location/update`,
          { latitude: loc.coords.latitude, longitude: loc.coords.longitude, battery: null, address: 'Live Update' },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (_) {}
    }, 5000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b']} style={s.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </LinearGradient>
    );
  }

  if (!token) {
    return (
      <LinearGradient colors={['#0f172a', '#1e293b']} style={s.center}>
        <View style={s.loginCard}>
          <View style={s.iconWrap}>
            <FontAwesome5 name="solar-panel" size={48} color="#f59e0b" />
          </View>
          <Text style={s.loginTitle}>SolarTrack</Text>
          <Text style={s.loginSub}>Field Operations Authentication</Text>
          <View style={s.inputWrap}>
            <Feather name="user" size={18} color="#94a3b8" style={{ paddingLeft: 14 }} />
            <TextInput
              style={s.input} placeholder="Operative Email" placeholderTextColor="#64748b"
              value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address"
            />
          </View>
          <View style={s.inputWrap}>
            <Feather name="lock" size={18} color="#94a3b8" style={{ paddingLeft: 14 }} />
            <TextInput
              style={s.input} placeholder="Security Passcode" placeholderTextColor="#64748b"
              value={password} onChangeText={setPassword} secureTextEntry
            />
          </View>
          <TouchableOpacity style={s.loginBtn} onPress={handleLogin}>
            <Text style={s.loginBtnText}>AUTHENTICATE</Text>
            <Feather name="arrow-right" size={20} color="#0f172a" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0f172a' }}>
      {/* Top Bar */}
      <View style={s.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={s.topDot} />
          <Text style={s.topTitle}>
            {activeTab === 'map' ? 'Solar Infrastructure Map' : activeTab === 'solars' ? 'Solar Panel Sites' : activeTab === 'tasks' ? 'Assigned Tasks' : 'Operative Dashboard'}
          </Text>
        </View>
        <Feather name="shield" size={18} color="#10b981" />
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1 }}>
        {activeTab === 'map'
          ? <MapTab token={token} />
          : activeTab === 'solars'
          ? <SolarTab token={token} />
          : activeTab === 'tasks'
          ? <TaskTab token={token} currentLoc={currentLoc} />
          : <DashboardTab currentLoc={currentLoc} />
        }
      </View>

      {/* Bottom Tab Bar */}
      <View style={s.tabBar}>
        <TouchableOpacity style={s.tabItem} onPress={() => setActiveTab('map')}>
          <View style={[s.tabIconWrap, activeTab === 'map' && s.tabIconActive]}>
            <MaterialIcons name="map" size={24} color={activeTab === 'map' ? '#f59e0b' : '#64748b'} />
          </View>
          <Text style={[s.tabLabel, activeTab === 'map' && s.tabLabelActive]}>Map</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.tabItem} onPress={() => setActiveTab('solars')}>
          <View style={[s.tabIconWrap, activeTab === 'solars' && s.tabIconActive]}>
            <FontAwesome5 name="solar-panel" size={20} color={activeTab === 'solars' ? '#f59e0b' : '#64748b'} />
          </View>
          <Text style={[s.tabLabel, activeTab === 'solars' && s.tabLabelActive]}>Solar Sites</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.tabItem} onPress={() => setActiveTab('tasks')}>
          <View style={[s.tabIconWrap, activeTab === 'tasks' && s.tabIconActive]}>
            <Feather name="check-square" size={22} color={activeTab === 'tasks' ? '#f59e0b' : '#64748b'} />
          </View>
          <Text style={[s.tabLabel, activeTab === 'tasks' && s.tabLabelActive]}>Tasks</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.tabItem} onPress={() => setActiveTab('dashboard')}>
          <View style={[s.tabIconWrap, activeTab === 'dashboard' && s.tabIconActive]}>
            <MaterialIcons name="dashboard" size={24} color={activeTab === 'dashboard' ? '#f59e0b' : '#64748b'} />
          </View>
          <Text style={[s.tabLabel, activeTab === 'dashboard' && s.tabLabelActive]}>Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginCard: { width: '100%', backgroundColor: 'rgba(30,41,59,0.8)', borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)' },
  iconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(245,158,11,0.12)', justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
  loginTitle: { fontSize: 30, fontWeight: '900', color: '#f8fafc', letterSpacing: 1, marginBottom: 4 },
  loginSub: { fontSize: 13, color: '#94a3b8', marginBottom: 28, textTransform: 'uppercase', letterSpacing: 1 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', width: '100%', backgroundColor: '#0f172a', borderRadius: 12, marginBottom: 14, borderWidth: 1, borderColor: '#334155' },
  input: { flex: 1, color: '#f8fafc', padding: 15, fontSize: 15 },
  loginBtn: { flexDirection: 'row', width: '100%', backgroundColor: '#f59e0b', padding: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  loginBtnText: { color: '#0f172a', fontWeight: '900', fontSize: 15, letterSpacing: 2, marginRight: 8 },
  topBar: { paddingTop: Platform.OS === 'ios' ? 50 : 38, paddingBottom: 14, paddingHorizontal: 20, backgroundColor: '#0f172a', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  topDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981', marginRight: 10 },
  topTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 17 },
  tabBar: { flexDirection: 'row', backgroundColor: '#0f172a', borderTopWidth: 1, borderTopColor: '#1e293b', paddingBottom: Platform.OS === 'ios' ? 24 : 8, paddingTop: 8 },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabIconWrap: { padding: 8, borderRadius: 12 },
  tabIconActive: { backgroundColor: 'rgba(245,158,11,0.12)' },
  tabLabel: { color: '#64748b', fontSize: 12, fontWeight: '600', marginTop: 2 },
  tabLabelActive: { color: '#f59e0b' },
});
