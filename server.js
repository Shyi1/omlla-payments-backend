const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const solanaWeb3 = require('@solana/web3.js');

// 1. CONFIGURATION
const PORT = process.env.PORT || 10000;
const ADMIN_WALLET = process.env.ADMIN_WALLET || "9eEeSQAAoKtm4Tc8njVeKLoZc4cwMhB9yr1gVsENmQEx";
const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com", "confirmed");

// 2. FIREBASE SETUP
try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
        }),
        databaseURL: "https://omllagame-default-rtdb.europe-west1.firebasedatabase.app/"
    });
    console.log("[SYSTEM] Firebase Connected.");
} catch (error) {
    console.error("[SYSTEM] Firebase Init Error:", error);
}

const db = admin.database();
const app = express();

// 3. SECURITY MIDDLEWARE
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10kb' }));

// Anti-Spam Rate Limiter
const requestCounts = new Map();
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    if (!requestCounts.has(ip)) requestCounts.set(ip, []);
    const requests = requestCounts.get(ip).filter(time => now - time < 60000);
    if (requests.length > 30) return res.status(429).json({ success: false, error: 'Too many requests.' });
    requests.push(now);
    requestCounts.set(ip, requests);
    next();
});

app.get('/health', (req, res) => res.status(200).send('OMLLA SERVER LIVE'));

// 4. GENERATE ORDER
app.post('/api/create-payment', async (req, res) => {
    try {
        const { userId, amount, pack, tokens } = req.body;
        if (!userId || !amount || !tokens) return res.status(400).json({ success: false, error: 'Invalid data' });

        const paymentId = 'ORD_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        await db.ref(`orders/${paymentId}`).set({
            userId, amount: parseFloat(amount), pack, tokens: parseInt(tokens),
            status: 'pending', timestamp: admin.database.ServerValue.TIMESTAMP
        });

        res.json({ success: true, paymentId, merchantWallet: ADMIN_WALLET });
    } catch (error) { res.status(500).json({ success: false, error: 'Server error' }); }
});

// 5. SECURE BLOCKCHAIN VERIFICATION
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { paymentId, transactionSignature } = req.body;
        if (!paymentId || !transactionSignature) return res.status(400).json({ success: false, error: 'Missing TX ID' });

        const orderRef = db.ref(`orders/${paymentId}`);
        const snap = await orderRef.once('value');
        const order = snap.val();

        if (!order || order.status === 'completed') return res.status(400).json({ success: false, error: 'Order invalid or already paid' });

        const tx = await connection.getParsedTransaction(transactionSignature, { maxSupportedTransactionVersion: 0, commitment: 'confirmed' });

        if (!tx) return res.status(400).json({ success: false, error: 'TX not found. Wait 10s.' });
        if (tx.meta.err) return res.status(400).json({ success: false, error: 'TX failed on blockchain.' });

        // Deep verification: Did funds reach your wallet?
        const accountKeys = tx.transaction.message.accountKeys;
        const adminAccountIndex = accountKeys.findIndex(acc => acc.pubkey.toBase58() === ADMIN_WALLET);

        if (adminAccountIndex === -1) return res.status(400).json({ success: false, error: 'Funds not sent to Merchant Wallet.' });

        const preBalance = tx.meta.preBalances[adminAccountIndex];
        const postBalance = tx.meta.postBalances[adminAccountIndex];
        const lamportsReceived = postBalance - preBalance;
        const expectedLamports = order.amount * solanaWeb3.LAMPORTS_PER_SOL;

        if (lamportsReceived < (expectedLamports - 100000)) return res.status(400).json({ success: false, error: 'Incorrect payment amount.' });
        
        // Success: Lock order & grant points
        await orderRef.update({ status: 'completed', signature: transactionSignature, verifiedAt: admin.database.ServerValue.TIMESTAMP });
        await db.ref(`players/${order.userId}/points`).transaction(p => (p || 0) + order.tokens);

        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false, error: 'Node busy. Try again.' }); }
});

// 6. CRASH PREVENTION
process.on('uncaughtException', (err) => console.error('[FATAL]', err));
process.on('unhandledRejection', (err) => console.error('[FATAL]', err));

app.listen(PORT, () => console.log(`[OMLLA] Server running on port ${PORT}`));
