const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// 1. Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // The replace function below fixes the Render environment variable newline issue
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
  }),
  databaseURL: "https://omllagame-default-rtdb.europe-west1.firebasedatabase.app/"
});

const db = admin.database();

// 2. Initialize Express App
const app = express();
app.use(cors());
app.use(express.json());

// 3. Health Check Endpoint (For Render to know the server is alive)
app.get('/', (req, res) => {
    res.send('OMLLA Payments Backend is LIVE 🚀');
});

// 4. Create Payment Endpoint
app.post('/api/create-payment', async (req, res) => {
    try {
        const { userId, amount, pack, tokens } = req.body;
        
        // Generate a unique order ID
        const paymentId = 'ORD_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        // Use the admin wallet from environment variables, or a fallback
        const merchantWallet = process.env.ADMIN_WALLET || "9eEeSQAAoKtm4Tc8njVeKLoZc4cwMhB9yr1gVsENmQEx";

        // Save the pending order to Firebase
        const orderRef = db.ref(`orders/${paymentId}`);
        await orderRef.set({
            userId: userId,
            amount: amount,
            pack: pack,
            tokens: tokens,
            status: 'pending',
            timestamp: admin.database.ServerValue.TIMESTAMP
        });

        res.json({ success: true, paymentId: paymentId, merchantWallet: merchantWallet });
    } catch (error) {
        console.error('Error creating payment:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// 5. Verify Payment Endpoint
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { paymentId, transactionSignature } = req.body;

        const orderRef = db.ref(`orders/${paymentId}`);
        const snapshot = await orderRef.once('value');
        const order = snapshot.val();

        if (!order) {
            return res.status(400).json({ success: false, error: 'Order not found' });
        }

        if (order.status === 'completed') {
            return res.status(400).json({ success: false, error: 'Order already verified' });
        }

        // Mark the order as completed
        await orderRef.update({ 
            status: 'completed', 
            transactionSignature: transactionSignature,
            completedAt: admin.database.ServerValue.TIMESTAMP
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error verifying payment:', error);
        res.status(500).json({ success: false, error: 'Internal Server Error' });
    }
});

// 6. Start the Server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
