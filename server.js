const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

// تهيئة Firebase
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

// إنشاء طلب الدفع
app.post('/api/create-payment', async (req, res) => {
    try {
        const { userId, amount, pack, tokens } = req.body;
        const paymentId = 'ORD_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        await db.ref(`orders/${paymentId}`).set({ userId, amount, pack, tokens, status: 'pending' });
        res.json({ success: true, paymentId });
    } catch (e) { res.status(500).json({ success: false }); }
});

// التحقق من الدفع (بسيط وسريع)
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { paymentId, transactionSignature } = req.body;
        const orderRef = db.ref(`orders/${paymentId}`);
        const snap = await orderRef.once('value');
        const order = snap.val();

        if (order && order.status !== 'completed') {
            await orderRef.update({ status: 'completed', signature: transactionSignature });
            await db.ref(`players/${order.userId}/points`).transaction(p => (p || 0) + order.tokens);
            return res.json({ success: true });
        }
        res.status(400).json({ success: false });
    } catch (e) { res.status(500).json({ success: false }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server Live"));
