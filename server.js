const express = require('express');

const cors = require('cors');

const admin = require('firebase-admin');

const dotenv = require('dotenv');



dotenv.config();



const app = express();

app.use(cors());

app.use(express.json());



// Firebase Connection

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



// Health Check 

app.get('/', (req, res) => {

    res.status(200).send('OMLLA SERVER IS LIVE 🚀');

});



// API Create Payment

app.post('/api/create-payment', async (req, res) => {

    try {

        const { userId, amount } = req.body;

        const payId = 'pay_' + Date.now();

        await db.ref('pending_payments/' + payId).set({

            userId, amount, status: 'pending', time: Date.now()

        });

        res.json({ success: true, paymentId: payId, wallet: process.env.ADMIN_WALLET });

    } catch (e) {

        res.status(500).json({ error: e.message });

    }

});



const PORT = process.env.PORT || 10000;

app.listen(PORT, '0.0.0.0', () => {

    console.log(`Server started on port ${PORT}`);

});
