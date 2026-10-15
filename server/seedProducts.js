const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const products = [
  {
    name: 'Cyberpunk Oversized Hoodie',
    category: 'Hoodies',
    price: 6490,
    stock: 50,
    image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Premium oversized hoodie with a cyberpunk aesthetic. Made from 100% organic cotton for ultimate comfort.'
  },
  {
    name: 'Vintage Acid Wash Tee',
    category: 'T-Shirts',
    price: 2690,
    stock: 100,
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Retro-inspired acid wash t-shirt. Features a boxy fit and distressed edges for that authentic vintage look.'
  },
  {
    name: 'Streetwear Cargo Pants',
    category: 'Pants',
    price: 7490,
    stock: 30,
    image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Functional and stylish cargo pants with multi-pocket design and adjustable straps. Perfect for urban exploration.'
  },
  {
    name: 'Y2K Metallic Puffer Jacket',
    category: 'Outerwear',
    price: 13990,
    stock: 15,
    image_url: 'https://images.unsplash.com/photo-1548126032-079a0fb0099d?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Shiny metallic puffer jacket that captures the Y2K vibe. Stay warm while looking futuristic.'
  },
  {
    name: 'Neon Graphic Sweatshirt',
    category: 'Hoodies',
    price: 5790,
    stock: 45,
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Soft fleece sweatshirt featuring a bold neon graphic. A standout piece for any casual outfit.'
  },
  {
    name: 'Distressed Denim Jacket',
    category: 'Outerwear',
    price: 7990,
    stock: 25,
    image_url: 'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Classic denim jacket with modern distressed details. A versatile layer for all seasons.'
  },
  {
    name: 'Wide-Leg Utility Jeans',
    category: 'Pants',
    price: 6490,
    stock: 40,
    image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'High-waisted utility jeans with a wide-leg cut. Combines comfort with a rugged aesthetic.'
  },
  {
    name: 'Techwear Windbreaker',
    category: 'Outerwear',
    price: 10990,
    stock: 35,
    image_url: 'https://images.unsplash.com/photo-1544022613-e87ca75a784a?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Water-resistant windbreaker with futuristic techwear details. Designed for both style and performance.'
  },
  {
    name: 'Vibrant Tie-Dye Hoodie',
    category: 'Hoodies',
    price: 6090,
    stock: 60,
    image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Unique hand-dyed tie-dye hoodie. Every piece is one-of-a-kind, just like you.'
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for seeding...');
    
    await Product.deleteMany();
    console.log('Existing products cleared.');
    
    await Product.insertMany(products);
    console.log('Initial products seeded successfully!');
    
    process.exit();
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
};

seedDB();
