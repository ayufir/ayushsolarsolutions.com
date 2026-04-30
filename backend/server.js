const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load env
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employee');
const locationRoutes = require('./routes/location');
const solarRoutes = require('./routes/solar');
const taskRoutes = require('./routes/task');
const analyticsRoutes = require('./routes/analytics');
const inventoryRoutes = require('./routes/inventory');
const attendanceRoutes = require('./routes/attendance');
const messageRoutes = require('./routes/messages');

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/solars', solarRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/messages', messageRoutes);
app.get('/api/test-tasks', (req, res) => res.send('Tasks API is alive'));

// Socket.io for Real-time location updates
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join_admin', () => {
    socket.join('admin_room');
    console.log('Admin joined room');
  });

  socket.on('employee_location_update', (data) => {
    // data contains location details, send to admin room
    io.to('admin_room').emit('receive_location_update', data);
  });

  socket.on('send_message', (data) => {
    // Broadcast message to everyone
    io.emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Seed Initial Admin User if none exists
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('admin123', salt);
      await User.create({
        name: 'Super Admin',
        employeeId: 'ADM001',
        email: 'admin@solarcompany.com',
        password: hashedPassword,
        role: 'admin'
      });
      console.log('Admin user seeded. Email: admin@solarcompany.com / Password: admin123');
    }
  } catch (err) {
    console.error('Error seeding admin:', err);
  }
};

// Database Connection
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('MongoDB Connected');
  seedAdmin();
  
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => {
  console.error('Database connection error:', err);
});
