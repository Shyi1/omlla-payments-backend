const express = require('express');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        databaseURL: process.env.FIREBASE_DB_URL
    });
}

const db = admin.database();

app.get('/', (req, res) => {
    res.status(200).send('OMLLA System Online');
});

app.post('/api/create-payment', async (req, res) => {
    try {
        const { userId, packageName, solAmount } = req.body;
        const paymentId = 'pay_' + Date.now();
        
        await db.ref('pending_payments/' + paymentId).set({
            userId,
            solAmount,
            packageName,
            status: 'pending',
            createdAt: Date.now()
        });

        res.json({
            success: true,
            paymentId: paymentId,
            merchantWallet: process.env.ADMIN_WALLET
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
