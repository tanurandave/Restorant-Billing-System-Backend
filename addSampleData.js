require('dotenv').config();
const mongoose = require('mongoose');
const Menu = require('./models/Menu');

const sampleMenuItems = [
  {
    name: 'Margherita Pizza',
    price: 250,
    category: 'Veg',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
    available: true
  },
  {
    name: 'Chicken Burger',
    price: 180,
    category: 'Non-Veg',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    available: true
  },
  {
    name: 'Caesar Salad',
    price: 150,
    category: 'Veg',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400',
    available: true
  },
  {
    name: 'Fish Curry',
    price: 220,
    category: 'Non-Veg',
    image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=400',
    available: true
  },
  {
    name: 'Chocolate Milkshake',
    price: 120,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400',
    available: true
  },
  {
    name: 'Coke',
    price: 40,
    category: 'Drinks',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400',
    available: true
  }
];

async function addSampleData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://trainerhub90_db_user:root@cluster0.jteazf6.mongodb.net/restaurant?appName=Cluster0');
    console.log('Connected to MongoDB');

    // Clear existing menu items
    await Menu.deleteMany({});
    console.log('Cleared existing menu items');

    // Add sample items
    await Menu.insertMany(sampleMenuItems);
    console.log('Added sample menu items');

    console.log('Sample data added successfully!');
  } catch (error) {
    console.error('Error adding sample data:', error);
  } finally {
    await mongoose.connection.close();
  }
}

addSampleData();