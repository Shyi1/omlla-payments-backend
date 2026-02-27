const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  }),
  databaseURL: "https://omllagame-default-rtdb.europe-west1.firebasedatabase.app/"
});

const db = admin.database();
const app = express();
app.use(cors());
app.use(express.json());

// Profile and Settings Endpoint
app.post('/api/update-profile', async (req, res) => {
    try {
        const { userId, paypal, solana } = req.body;
        await db.ref(`players/${userId}`).update({ paypal, solana });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
