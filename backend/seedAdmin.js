const mongoose = require('mongoose');
const Admin = require('./models/Admin');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/carparking';

mongoose.connect(MONGO_URI).then(async () => {
  try {
    let admin = await Admin.findOne({ admin_id: 'ADMIN001' });
    if (!admin) {
      admin = new Admin({
        admin_id: 'ADMIN001',
        username: 'admin',
        full_name: 'Super Admin',
        email: 'admin@carparking.com'
      });
    }
    
    // Set or reset password
    admin.password = 'admin123';
    await admin.save();
    
    console.log('✅ Admin user created/updated successfully.');
    console.log('Login ID (Username or Admin ID): admin');
    console.log('Password: admin123');
  } catch (err) {
    console.error('❌ Error updating admin user:', err);
  } finally {
    mongoose.connection.close();
  }
}).catch(err => {
  console.error('❌ Error connecting to MongoDB:', err);
  process.exit(1);
});
