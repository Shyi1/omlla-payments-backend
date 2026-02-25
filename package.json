const express = require('express');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            // Format private key correctly for cloud hosting environments
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DB_URL
    });
}

const db = admin.database();

// Root endpoint for Health Check
app.get('/', (req, res) => {
    res.send('OMLLA Backend is Live 🚀');
});

// Create Payment Request Endpoint
app.post('/api/create-payment', async (req, res) => {
    try {
        const { userId, amount, packageName, solAmount } = req.body;
        const paymentId = 'pay_' + Date.now();
        
        // Save payment details to Firebase under pending_payments
        await db.ref('pending_payments/' + paymentId).set({
            userId, 
            amount, 
            solAmount, 
            packageName, 
            status: 'pending', 
            createdAt: Date.now()
        });

        // Return payment ID and the Admin Wallet address from environment variables
        res.json({
            success: true,
            paymentId: paymentId,
            merchantWallet: process.env.ADMIN_WALLET
        });
    } catch (error) {
        console.error("Payment Creation Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start the server on the port defined by Render or default to 10000
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
