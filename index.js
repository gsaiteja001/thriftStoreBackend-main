const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const sellerCategoriesRouter = require('./routes/sellerCategories');
const stockTransactionsRouter = require('./routes/stockTransaction');
const ordersRouter = require('./routes/orders');
const itemsrouter =require('./routes/items');
const routes = require('./routes/index');

app.use('/api/vendor-categories', sellerCategoriesRouter);
app.use('/api/Stock-transactions', stockTransactionsRouter);
app.use('/api/orders', ordersRouter);

const productImage = require('./productImageUpload')
app.use('/upload_product_image',productImage);


app.use('/api/item', itemsrouter);
// Routes
app.use('/api', routes);



app.post('/payment/record', async (req, res) => {
  const { order_id, item_id, vendor_id, payment_amount, payment_method = 'card', status = 'paid' } = req.body;

  if (!order_id || !item_id || !vendor_id || !payment_amount) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  try {
    const payment_id = Math.floor(Math.random() * 1000000000);
    const payment_date = new Date().toISOString();
    const payment_type = 'credit';

    // Step 1: Get the last balance for this vendor
    const [lastPayment] = await db.query(
      'SELECT total_balance_vendor FROM payment WHERE vendor_id = ? ORDER BY payment_date DESC LIMIT 1',
      [vendor_id]
    );

    const previous_balance = lastPayment.length > 0 ? parseFloat(lastPayment[0].total_balance_vendor) : 0;
    const new_balance = previous_balance + parseFloat(payment_amount);

    // Step 2: Insert new payment
    await db.query(
      `INSERT INTO payment (
        payment_id, order_id, payment_amount, payment_date, 
        payment_method, status, payment_type, total_balance_vendor, vendor_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payment_id, order_id, payment_amount, payment_date,
        payment_method, status, payment_type, new_balance, vendor_id
      ]
    );

    res.status(201).json({
      message: 'Payment recorded successfully.',
      payment_id,
      vendor_id,
      total_balance_vendor: new_balance
    });

  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ error: error.message });
  }
});



const verifyRoutes = require('./verifyRoute');
app.use('/twilio', verifyRoutes);


// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
