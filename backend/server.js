require('dotenv').config();
const express   = require('express');
const mongoose  = require('mongoose');
const cors      = require('cors');

const Admin        = require('./models/Admin');
const ParkingOwner = require('./models/ParkingOwner');

const authRoutes   = require('./routes/auth');
const userRoutes   = require('./routes/users');
const ownerRoutes  = require('./routes/owners');
const announcementRoutes = require('./routes/announcements');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────
app.use(cors({
  origin: '*',   // Allow all origins for local HTML files
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────
app.use('/api/auth',   authRoutes);
app.use('/api/users',  userRoutes);
app.use('/api/owners', ownerRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/bookings', require('./routes/bookings'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date().toISOString() }));

// Public slots endpoint
app.get('/api/slots', async (req, res) => {
  try {
    const owners = await ParkingOwner.find({});
    let allSlots = [];
    owners.forEach(o => {
      if(o.slots && o.slots.length > 0) {
        const oSlots = o.slots.map(s => ({ ...s.toObject(), owner_id: o._id, lot_name: o.lot_name, pricePerHour: o.pricePerHour }));
        allSlots = allSlots.concat(oSlots);
      }
    });
    res.json({ success: true, slots: allSlots });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DB Connect & Seed ───────────────────────

// List of all admins to seed on first run
const ADMIN_SEEDS = [
  {
    admin_id:  'ADMIN001',
    username:  'admin',
    password:  'Admin@123',
    full_name: 'System Administrator',
    email:     'admin@carparking.com',
  },
  {
    admin_id:  'ADMIN002',
    username:  'prabanjan',
    password:  'prabanjan@15',
    full_name: 'Prabanjan',
    email:     'prabanjan@carparking.com',
  },
  {
    admin_id:  'ADMIN003',
    username:  'ragul',
    password:  'ragul@23',
    full_name: 'Ragul',
    email:     'ragul@carparking.com',
  },
  {
    admin_id:  'ADMIN004',
    username:  'nigil',
    password:  'nigil@22R',
    full_name: 'Nigil',
    email:     'nigil@carparking.com',
  },
];

async function seedDefaults() {
  // ── Seed all admins ──────────────────────
  for (const adm of ADMIN_SEEDS) {
    const exists = await Admin.findOne({ admin_id: adm.admin_id });
    if (!exists) {
      await Admin.create({ ...adm, role: 'admin' });
      console.log(`✅  Admin seeded → ID: ${adm.admin_id} | User: ${adm.username} | Pass: ${adm.password}`);
    }
  }

  // ── Seed default Parking Owner ───────────
  const ownerExists = await ParkingOwner.findOne({ owner_id: 'OWNER001' });
  if (!ownerExists) {
    await ParkingOwner.create({
      owner_id:    'OWNER001',
      username:    'owner1',
      password:    'Owner@123',
      full_name:   'Parking Owner One',
      email:       'owner1@carparking.com',
      lot_name:    'Central Parking Lot',
      location:    'Main Street',
      total_slots: 8,
      pricePerHour: 20,
      slots: [
        { id: 'A1', status: 'available' }, { id: 'A2', status: 'occupied' },
        { id: 'B1', status: 'available' }, { id: 'B2', status: 'available' },
        { id: 'C1', status: 'occupied' }, { id: 'C2', status: 'available' },
        { id: 'D1', status: 'available' }, { id: 'D2', status: 'occupied' }
      ],
      role:        'parking_owner',
      status:      'active'
    });
    console.log('✅  Default owner seeded  (ID: OWNER001 | Pass: Owner@123)');
  }
}

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('🍃  MongoDB connected →', process.env.MONGO_URI);
    await seedDefaults();
    app.listen(PORT, () => {
      console.log(`🚀  Server running at http://localhost:${PORT}`);
      console.log('──────────────────────────────────────────');
      console.log('  API Endpoints:');
      console.log(`  POST   http://localhost:${PORT}/api/auth/login`);
      console.log(`  POST   http://localhost:${PORT}/api/auth/register`);
      console.log(`  GET    http://localhost:${PORT}/api/users`);
      console.log(`  GET    http://localhost:${PORT}/api/owners`);
      console.log('──────────────────────────────────────────');
    });
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
