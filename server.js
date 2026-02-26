const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const solanaWeb3 = require('@solana/web3.js');

// 1. تهيئة الاتصال السريع بشبكة سولانا (Mainnet)
const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com", "confirmed");

// 2. تهيئة قاعدة بيانات Firebase بأمان
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    // معالجة الفواصل لتجنب أخطاء Render
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
  }),
  databaseURL: "https://omllagame-default-rtdb.europe-west1.firebasedatabase.app/"
});

const db = admin.database();
const app = express();

// السماح للواجهة بالاتصال بالسيرفر بدون حظر
app.use(cors({ origin: '*' }));
app.use(express.json());

const ADMIN_WALLET = process.env.ADMIN_WALLET || "9eEeSQAAoKtm4Tc8njVeKLoZc4cwMhB9yr1gVsENmQEx";

// ---------------------------------------------------------
// [نقطة النهاية 1]: إنشاء طلب دفع جديد (Sales Funnel)
// ---------------------------------------------------------
app.post('/api/create-payment', async (req, res) => {
    try {
        const { userId, amount, pack, tokens } = req.body;
        
        // توليد معرف فريد للعملية لتتبع المبيعات
        const paymentId = 'ORD_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        // تسجيل الطلب في قاعدة البيانات بحالة "قيد الانتظار"
        await db.ref(`orders/${paymentId}`).set({
            userId, 
            amount, 
            pack, 
            tokens,
            status: 'pending',
            timestamp: admin.database.ServerValue.TIMESTAMP
        });

        res.json({ success: true, paymentId, merchantWallet: ADMIN_WALLET });
    } catch (error) {
        console.error("Create Payment Error:", error);
        res.status(500).json({ success: false, error: 'Failed to initialize protocol' });
    }
});

// ---------------------------------------------------------
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { paymentId, transactionSignature } = req.body;

        if (!paymentId || !transactionSignature) {
            return res.status(400).json({ success: false, error: 'Missing transaction data' });
        }

        const orderRef = db.ref(`orders/${paymentId}`);
        const snap = await orderRef.once('value');
        const order = snap.val();

        if (!order || order.status === 'completed') {
            return res.status(400).json({ success: false, error: 'Order is invalid or already claimed' });
        }

        const txStatus = await connection.getSignatureStatus(transactionSignature);

        if (!txStatus || !txStatus.value || txStatus.value.err) {
            return res.status(400).json({ success: false, error: 'Transaction not found. If you just paid, wait 15 seconds.' });
        }

        await orderRef.update({ 
            status: 'completed', 
            signature: transactionSignature,
            verifiedAt: admin.database.ServerValue.TIMESTAMP 
        });

    
        const userPointsRef = db.ref(`players/${order.userId}/points`);
        await userPointsRef.transaction((currentPoints) => {
            return (currentPoints || 0) + order.tokens;
        });

        console.log(`[REVENUE] Verified ${order.amount} SOL for user ${order.userId}`);
        res.json({ success: true });

    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ success: false, error: 'Node validation failed. Try again.' });
    }
});

// ---------------------------------------------------------
// ---------------------------------------------------------
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`[OMLLA ENGINE] Active and strictly monitoring on port ${PORT}`);
});

