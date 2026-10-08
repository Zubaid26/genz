const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const products = [
  {
    name: 'Cyberpunk Oversized Hoodie',
    category: 'Hoodies',
    price: 59.99,
    stock: 50,
    image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Premium oversized hoodie with a cyberpunk aesthetic. Made from 100% organic cotton for ultimate comfort.'
  },
  {
    name: 'Vintage Acid Wash Tee',
    category: 'T-Shirts',
    price: 29.99,
    stock: 100,
    image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Retro-inspired acid wash t-shirt. Features a boxy fit and distressed edges for that authentic vintage look.'
  },
  {
    name: 'Streetwear Cargo Pants',
    category: 'Pants',
    price: 74.99,
    stock: 30,
    image_url: 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Functional and stylish cargo pants with multi-pocket design and adjustable straps. Perfect for urban exploration.'
  },
  {
    name: 'Y2K Metallic Puffer Jacket',
    category: 'Outerwear',
    price: 129.99,
    stock: 15,
    image_url: 'https://images.unsplash.com/photo-1591047139829-d91aec16adcd?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Shiny metallic puffer jacket that captures the Y2K vibe. Stay warm while looking futuristic.'
  },
  {
    name: 'Neon Graphic Sweatshirt',
    category: 'Hoodies',
    price: 49.99,
    stock: 45,
    image_url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Soft fleece sweatshirt featuring a bold neon graphic. A standout piece for any casual outfit.'
  },
  {
    name: 'Distressed Denim Jacket',
    category: 'Outerwear',
    price: 89.99,
    stock: 25,
    image_url: 'https://images.unsplash.com/photo-1576871333019-220ef3c68f59?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Classic denim jacket with modern distressed details. A versatile layer for all seasons.'
  },
  {
    name: 'Gothic Lolita Boots',
    category: 'Footwear',
    price: 110.00,
    stock: 20,
    image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Platform gothic boots with silver buckle details. Elevate your street style literally.'
  },
  {
    name: 'Anime Print Tote Bag',
    category: 'Accessories',
    price: 19.99,
    stock: 150,
    image_url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Eco-friendly canvas tote bag with a custom anime aesthetic print. Perfect for daily essentials.'
  },
  {
    name: 'Wide-Leg Utility Jeans',
    category: 'Pants',
    price: 65.00,
    stock: 40,
    image_url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'High-waisted utility jeans with a wide-leg cut. Combines comfort with a rugged aesthetic.'
  },
  {
    name: 'Retro Round Sunglasses',
    category: 'Accessories',
    price: 14.99,
    stock: 200,
    image_url: 'https://images.unsplash.com/photo-1511499767390-91f19703000a?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Lightweight round sunglasses with tinted lenses. A must-have accessory for summer festivals.'
  },
  {
    name: 'Techwear Windbreaker',
    category: 'Outerwear',
    price: 95.00,
    stock: 35,
    image_url: 'https://images.unsplash.com/photo-1591047139829-d91aec16adcd?q=80&w=800',
    overlay_image_url: 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png',
    description: 'Water-resistant windbreaker with futuristic techwear details. Designed for both style and performance.'
  },
  {
    name: 'Vibrant Tie-Dye Hoodie',
    category: 'Hoodies',
    price: 55.00,
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
