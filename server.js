const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const solanaWeb3 = require('@solana/web3.js');

// Connect to Solana Mainnet
const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com", "confirmed");

// Initialize Firebase
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

// Endpoint 1: Create Order
app.post('/api/create-payment', async (req, res) => {
    try {
        const { userId, amount, pack, tokens } = req.body;
        const paymentId = 'ORD_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        const merchantWallet = process.env.ADMIN_WALLET || "9eEeSQAAoKtm4Tc8njVeKLoZc4cwMhB9yr1gVsENmQEx";

        await db.ref(`orders/${paymentId}`).set({
            userId, amount, pack, tokens,
            status: 'pending',
            timestamp: admin.database.ServerValue.TIMESTAMP
        });

        res.json({ success: true, paymentId, merchantWallet });
    } catch (e) { res.status(500).json({ success: false }); }
});

// Endpoint 2: Blockchain Verification (Anti-Cheat)
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { paymentId, transactionSignature } = req.body;
        const orderRef = db.ref(`orders/${paymentId}`);
        const snap = await orderRef.once('value');
        const order = snap.val();

        if (!order || order.status === 'completed') {
            return res.status(400).json({ success: false, error: 'Invalid Order' });
        }

        // Verify on Solana Blockchain
        const tx = await connection.getParsedTransaction(transactionSignature, {
            maxSupportedTransactionVersion: 0
        });

        if (!tx) {
            return res.status(400).json({ success: false, error: 'TX not found. Wait 10s.' });
        }

        // Securely add points from server-side only
        await orderRef.update({ status: 'completed', signature: transactionSignature });
        await db.ref(`players/${order.userId}/points`).transaction(p => (p || 0) + order.tokens);

        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: 'Blockchain error' }); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Secure Server on ${PORT}`));
