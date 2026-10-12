// Refreshes the catalogue with modest, clothing-only Gen-Z / Pakistani-style products
// (shalwar kameez, kurtas, hoodies, tees, baggy jeans, women's wear).
//   1. removes the earlier demo products that were added by the previous version of this script
//      (bold dresses, shoes and accessories);
//   2. inserts the new products if they are not already present (matched by name).
// Original products created by seedProducts.js are never touched.
//   Usage: node addProducts.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');

dotenv.config();

const OVERLAY = 'https://cdn-icons-png.flaticon.com/512/3531/3531744.png';
const img = (id) => `https://images.unsplash.com/photo-${id}?q=80&w=800`;

const REMOVE = [
  'Denim Dot Button-Up', 'Essential Oxford Shirt', 'Minimal Black Crest Tee', 'Typography Black Tee',
  'Sky Blue Office Shirt', 'Grunge Plaid Flannel', 'Everyday White Tee', 'Slim Khaki Chinos',
  'Classic Black Straight Jeans', 'Dark Indigo Wide Jeans', 'Light Wash Skinny Jeans', 'Stonewash Relaxed Jeans',
  'Blush Satin Jogger Pants', 'Crimson Flow Maxi Dress', 'Retro Red Belted Dress', 'Floral Beach Wrap Dress',
  'White Off-Shoulder Mini', 'Sky Blue Slit Wrap Dress', 'Plum Off-Shoulder Gown', 'Burgundy Button Midi Dress',
  'Scarlet Long-Sleeve Evening Dress', 'Monochrome Leather Biker Jacket', 'Olive Utility Field Jacket',
  'Black Rider Leather Jacket', 'Camel Wool Overcoat', 'Midnight Bomber Jacket', 'Washed Denim Trucker Jacket',
  'Crimson Flyknit Runners', 'Urban Grey Trainers', 'Tan Leather Low Sneakers', 'Black Performance Trainers',
  'Pastel Court Sneakers', 'Sunset Orange Runners', 'Classic White Court Sneakers', 'Maroon Skate Shoes',
  'Black Wayfarer Sunglasses', 'Gold-Frame Round Shades', 'Navy Daily Backpack', 'Minimal White Smartwatch',
  'Knit Beanie Pack', 'Orange Wicker Handbag', 'Floral Print Handbag', 'Scarlet Top-Handle Bag'
];

// [name, category, price, stock, unsplash photo id, description]
const rows = [
  // ---- Shalwar Kameez ----
  ['Charcoal Shalwar Kameez', 'Shalwar Kameez', 44.99, 40, '1710624125523-3420db282dfe', 'Soft charcoal kameez with matching shalwar. Clean, simple and comfortable for everyday wear.'],
  ['Classic White Shalwar Kameez', 'Shalwar Kameez', 39.99, 60, '1734418040900-e964f84e8abb', 'The all-time classic in crisp white cotton. Perfect for Fridays, Eid and family functions.'],
  ['Pure Cotton White Kameez Set', 'Shalwar Kameez', 42.99, 35, '1734418038940-2e5ee6a1b478', 'Breathable cotton kameez set with a relaxed fit. Stays cool in summer.'],
  ['Everyday White Suit', 'Shalwar Kameez', 36.99, 50, '1734418038517-ffc3a6a6751f', 'Easy white shalwar kameez for college, work and prayers. Simple and neat.'],
  ['Black Shalwar Kameez', 'Shalwar Kameez', 46.99, 28, '1710868941935-4ecf76ce8a6d', 'Deep black shalwar kameez with a sharp collar band. Looks smart on any occasion.'],
  ['Festive White Kameez', 'Shalwar Kameez', 47.99, 8, '1734418053756-aad1c16d3558', 'Slightly fitted white kameez for Eid and weddings, pairs well with a waistcoat.'],
  // ---- Kurtas ----
  ['Mint Green Cotton Kurta', 'Kurtas', 29.99, 45, '1727835523545-70ee992b5763', 'Light mint kurta in soft cotton. Wear it with white pajama or jeans.'],
  ['Pastel Yellow Kurta', 'Kurtas', 27.99, 38, '1701365676249-9d7ab5022dec', 'Fresh pastel yellow kurta with a mandarin collar. Great for summer days.'],
  ['Maroon Straight Kurta', 'Kurtas', 31.99, 30, '1628250521470-28c1fc54616c', 'Rich maroon kurta that goes with white shalwar or denim.'],
  ['Pink Chikankari Kurta', 'Kurtas', 34.99, 22, '1667665970121-c3504c519cda', 'Soft pink kurta with a fine self-textured pattern. Light and easy to style.'],
  ['Navy Embroidered Collar Kurta', 'Kurtas', 36.99, 26, '1624970415682-3f99fae61a94', 'Navy kurta with delicate embroidery on the collar.'],
  ['Royal Blue Kurta Shalwar', 'Kurtas', 49.99, 18, '1770359993283-a2c2f386584e', 'Royal blue kurta with matching shalwar, ideal for events and festivals.'],
  ['Grey Short-Sleeve Kurta', 'Kurtas', 26.99, 0, '1785613590746-f57d638c7d38', 'Relaxed grey short-sleeve kurta, an easy everyday piece.'],
  ['Black Cotton Kurta', 'Kurtas', 32.99, 33, '1744551358303-46edae8b374b', 'Plain black kurta with a modern cut. Dress it up or down.'],
  // ---- Hoodies ----
  ['Taupe Oversized Hoodie', 'Hoodies', 39.99, 60, '1564557287817-3785e38ec1f5', 'Heavy fleece hoodie in taupe with a relaxed oversized fit.'],
  ['Brown Pullover Hoodie', 'Hoodies', 41.99, 44, '1611817757591-c3f345024273', 'Cozy brown pullover with a kangaroo pocket. Your go-to for cold evenings.'],
  ['Cloud White Hoodie', 'Hoodies', 43.99, 36, '1688111421205-a0a85415b224', 'Plain white hoodie, soft inside, roomy fit. Goes with everything.'],
  ['Midnight Black Hoodie', 'Hoodies', 44.99, 52, '1633292750937-120a94f5c2bb', 'Black oversized hoodie with a small chest logo.'],
  ['Slogan Back-Print Hoodie', 'Hoodies', 46.99, 7, '1698684420707-33f4433f8bd8', 'Oversized black hoodie with a positive slogan printed on the back.'],
  ['Charcoal Zero-Fuss Hoodie', 'Hoodies', 40.99, 48, '1677538537484-324385aff147', 'Dark charcoal hoodie that is simple and comfortable for campus days.'],
  ['Maroon Embroidered Hoodie', 'Hoodies', 47.99, 20, '1721111259873-5a13f7fcd67b', 'Deep red hoodie with a small embroidered back design.'],
  ['Lavender Cloud Hoodie', 'Hoodies', 42.99, 25, '1601396344868-31e008cd6e7c', 'Light lavender hoodie, super soft with a slightly oversized fit.'],
  // ---- T-Shirts ----
  ['Boxy White Graphic Tee', 'T-Shirts', 21.99, 90, '1627225924765-552d49cf47ad', 'Boxy white tee with a small centre print. Easy everyday basic.'],
  ['Back-Print Oversized Tee', 'T-Shirts', 24.99, 70, '1627225793904-a2f900a6e4cf', 'Oversized white tee with a minimal typography print on the back.'],
  ['Retro Badge White Tee', 'T-Shirts', 23.99, 65, '1616006897093-5e4635c0de35', 'Relaxed white tee with a vintage chest badge.'],
  ['Black Drop-Shoulder Tee', 'T-Shirts', 24.99, 80, '1661110546797-d86cc72a2765', 'Black drop-shoulder tee in heavy cotton with a loose, baggy fit.'],
  ['Blush Pink Slogan Tee', 'T-Shirts', 22.99, 55, '1775234576197-b916f4115679', 'Soft pink oversized tee with a slogan print.'],
  ['Pink Oversized Statement Tee', 'T-Shirts', 22.99, 6, '1775234576241-54cbf57ffd74', 'Oversized pink tee that looks great with baggy jeans.'],
  // ---- Jeans ----
  ['Washed Wide-Leg Baggy Jeans', 'Jeans', 49.99, 34, '1674075872359-a174bc7ed420', 'Light-wash baggy jeans with a loose wide leg. Pure Gen-Z comfort.'],
  ['Relaxed Skater Baggy Jeans', 'Jeans', 52.99, 28, '1767899390509-892ad3978dfa', 'Extra baggy skater fit in classic blue denim.'],
  ['Baggy Blue Denim', 'Jeans', 54.99, 24, '1728782741559-a7e8d68b6a84', 'Wide-leg blue denim, easy to style with an oversized hoodie.'],
  // ---- Women ----
  ['Emerald Printed Kameez Set', 'Women', 59.99, 16, '1597983073540-684a10b15ab1', 'Emerald green kameez with colourful embroidery and a flowing shalwar. Made for festive days.'],
  ['White Cotton Kurti', 'Women', 29.99, 40, '1655288828238-21d86ec971c3', 'Simple white cotton kurti with three-quarter sleeves. Light, elegant and easy to wear.'],
  ['Blush Pink Hoodie', 'Women', 42.99, 18, '1516195851888-6f1a981a862e', 'Soft pink hoodie cut for a relaxed, comfortable fit.']
];

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected.');

    const removed = await Product.deleteMany({ name: { $in: REMOVE } });
    console.log(`Removed ${removed.deletedCount} earlier demo product(s).`);

    let added = 0;
    for (const [name, category, price, stock, photo, description] of rows) {
      if (await Product.exists({ name })) continue;
      await Product.create({ name, category, price, stock, description, image_url: img(photo), overlay_image_url: OVERLAY });
      added++;
    }
    console.log(`Added ${added} new product(s), skipped ${rows.length - added} already present.`);

    const counts = await Product.aggregate([{ $group: { _id: '$category', n: { $sum: 1 } } }, { $sort: { _id: 1 } }]);
    counts.forEach((c) => console.log(`  ${c._id}: ${c.n}`));
    process.exit(0);
  } catch (error) {
    console.error('Error updating products:', error.message);
    process.exit(1);
  }
};

run();
