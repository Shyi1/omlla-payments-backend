const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const solanaWeb3 = require('@solana/web3.js');

// ==========================================
// 1. SYSTEM INITIALIZATION & CONFIG
// ==========================================
const PORT = process.env.PORT || 10000;
const ADMIN_WALLET = process.env.ADMIN_WALLET || "9eEeSQAAoKtm4Tc8njVeKLoZc4cwMhB9yr1gVsENmQEx";

// Use public Mainnet RPC (Consider Alchemy/QuickNode for massive scale later)
const connection = new solanaWeb3.Connection("https://api.mainnet-beta.solana.com", "confirmed");

// Firebase Initialization with error handling
try {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined
        }),
        databaseURL: "https://omllagame-default-rtdb.europe-west1.firebasedatabase.app/"
    });
    console.log("[DATABASE] Firebase connected successfully.");
} catch (error) {
    console.error("[DATABASE] Firebase Init Error:", error);
}

const db = admin.database();
const app = express();

// ==========================================
// 2. MIDDLEWARE & SECURITY
// ==========================================
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks

// Simple Custom Rate Limiter to prevent API spam
const requestCounts = new Map();
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    if (!requestCounts.has(ip)) requestCounts.set(ip, []);
    
    const requests = requestCounts.get(ip).filter(time => now - time < 60000); // 1 minute window
    if (requests.length > 30) {
        return res.status(429).json({ success: false, error: 'Too many requests. Please slow down.' });
    }
    requests.push(now);
    requestCounts.set(ip, requests);
    next();
});

// Health Check Endpoint (Keeps Render Server Awake)
app.get('/health', (req, res) => res.status(200).send('OMLLA SERVER IS HEALTHY AND LIVE'));

// ==========================================
// 3. CORE ENDPOINTS (SALES & REVENUE)
// ==========================================

// Endpoint: Generate Order
app.post('/api/create-payment', async (req, res) => {
    try {
        const { userId, amount, pack, tokens } = req.body;
        if (!userId || !amount || !tokens) return res.status(400).json({ success: false, error: 'Invalid data' });

        const paymentId = 'ORD_' + Math.random().toString(36).substr(2, 9).toUpperCase();
        
        await db.ref(`orders/${paymentId}`).set({
            userId, 
            amount: parseFloat(amount), 
            pack, 
            tokens: parseInt(tokens),
            status: 'pending',
            timestamp: admin.database.ServerValue.TIMESTAMP
        });

        res.json({ success: true, paymentId, merchantWallet: ADMIN_WALLET });
    } catch (error) {
        console.error("[API] Create Payment Error:", error);
        res.status(500).json({ success: false, error: 'Server error creating order' });
    }
});

// Endpoint: Secure Blockchain Verification
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { paymentId, transactionSignature } = req.body;
        if (!paymentId || !transactionSignature) {
            return res.status(400).json({ success: false, error: 'Missing TX ID' });
        }

        const orderRef = db.ref(`orders/${paymentId}`);
        const snap = await orderRef.once('value');
        const order = snap.val();

        // Check 1: Order exists and is pending
        if (!order || order.status === 'completed') {
            return res.status(400).json({ success: false, error: 'Order already processed or invalid' });
        }

        // Check 2: Fetch FULL transaction details from Solana
        const tx = await connection.getParsedTransaction(transactionSignature, {
            maxSupportedTransactionVersion: 0,
            commitment: 'confirmed'
        });

        if (!tx) {
            return res.status(400).json({ success: false, error: 'Transaction not found on Solana yet. Please wait 10 seconds.' });
        }

        if (tx.meta.err) {
            return res.status(400).json({ success: false, error: 'This transaction failed on the blockchain.' });
        }

        // Check 3: DEEP VERIFICATION - Did the EXACT amount go to YOUR wallet?
        const accountKeys = tx.transaction.message.accountKeys;
        const adminAccountIndex = accountKeys.findIndex(acc => acc.pubkey.toBase58() === ADMIN_WALLET);

        if (adminAccountIndex === -1) {
            return res.status(400).json({ success: false, error: 'Invalid transaction: Funds were not sent to the Merchant Wallet.' });
        }

        const preBalance = tx.meta.preBalances[adminAccountIndex];
        const postBalance = tx.meta.postBalances[adminAccountIndex];
        const lamportsReceived = postBalance - preBalance;
        
        // Convert expected SOL to Lamports (1 SOL = 1,000,000,000 Lamports)
        const expectedLamports = order.amount * solanaWeb3.LAMPORTS_PER_SOL;

        // Allow 0.0001 SOL margin of error for network gas fluctuations
        if (lamportsReceived < (expectedLamports - 100000)) {
            return res.status(400).json({ success: false, error: 'Invalid transaction: Payment amount is incorrect.' });
        }

        // ==========================================
        // 4. TRANSACTION SUCCESS - REWARD USER
        // ==========================================
        
        // Lock the order immediately to prevent double-spending
        await orderRef.update({ 
            status: 'completed', 
            signature: transactionSignature,
            verifiedAt: admin.database.ServerValue.TIMESTAMP 
        });

        // Safely add points to user
        const userPointsRef = db.ref(`players/${order.userId}/points`);
        await userPointsRef.transaction((currentPoints) => {
            return (currentPoints || 0) + order.tokens;
        });

        console.log(`[SUCCESS] User ${order.userId} purchased ${order.pack} for ${order.amount} SOL`);
        res.json({ success: true });

    } catch (error) {
        console.error("[API] Verification Error:", error);
        res.status(500).json({ success: false, error: 'Blockchain node busy. Please try verifying again.' });
    }
});

// ==========================================
// 5. CRASH PREVENTION (STAY ALIVE)
// ==========================================
process.on('uncaughtException', (err) => {
    console.error('[FATAL] Uncaught Exception:', err);
    // Prevents the server from going completely offline
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start Server
app.listen(PORT, () => {
    console.log(`[OMLLA ENGINE] Secure Server Active on port ${PORT}`);
});
