const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccount = require('./firebase-service-account.json'); // Download from Firebase Console
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://your-project.firebaseio.com" // Replace with your URL
});

const db = admin.database();

// Solana connection
const connection = new Connection('https://api.mainnet-beta.solana.com'); // Use mainnet for production

// Your Solana wallet address to receive payments
const MERCHANT_WALLET = new PublicKey('YOUR_SOLANA_WALLET_ADDRESS_HERE');

// Payment endpoint
app.post('/api/create-payment', async (req, res) => {
    try {
        const { userId, amount, package: packageName } = req.body;
        
        // Calculate price in SOL (example: 1000 O$ = 0.1 SOL)
        const solAmount = amount * 0.0001; // Adjust this ratio
        
        // Generate unique payment ID
        const paymentId = 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Store payment request in Firebase
        await db.ref('payments/' + paymentId).set({
            userId,
            amount,
            packageName,
            solAmount,
            status: 'pending',
            createdAt: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000 // 30 minutes expiry
        });
        
        res.json({
            success: true,
            paymentId,
            solAmount,
            merchantWallet: MERCHANT_WALLET.toString(),
            message: `Send ${solAmount} SOL to this address`
        });
        
    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Verify payment endpoint
app.post('/api/verify-payment', async (req, res) => {
    try {
        const { paymentId, transactionSignature } = req.body;
        
        // Get payment details from Firebase
        const paymentSnapshot = await db.ref('payments/' + paymentId).once('value');
        const payment = paymentSnapshot.val();
        
        if (!payment) {
            return res.status(404).json({ success: false, error: 'Payment not found' });
        }
        
        if (payment.status === 'completed') {
            return res.json({ success: true, message: 'Already completed' });
        }
        
        // Verify transaction on Solana blockchain
        const tx = await connection.getTransaction(transactionSignature, {
            commitment: 'confirmed'
        });
        
        if (!tx) {
            return res.status(400).json({ success: false, error: 'Transaction not found' });
        }
        
        // Check if transaction sent correct amount to merchant wallet
        const postBalances = tx.meta.postBalances;
        const preBalances = tx.meta.preBalances;
        const accountKeys = tx.transaction.message.accountKeys;
        
        let amountSent = 0;
        accountKeys.forEach((key, index) => {
            if (key.toString() === MERCHANT_WALLET.toString()) {
                amountSent = (postBalances[index] - preBalances[index]) / LAMPORTS_PER_SOL;
            }
        });
        
        // Verify amount matches expected
        if (Math.abs(amountSent - payment.solAmount) < 0.0001) { // Allow small margin of error
            // Update payment status
            await db.ref('payments/' + paymentId).update({
                status: 'completed',
                transactionSignature,
                verifiedAt: Date.now()
            });
            
            // Add coins to user's balance
            await db.ref('players/' + payment.userId).transaction(current => {
                if (current) {
                    current.points = (current.points || 0) + payment.amount;
                }
                return current;
            });
            
            res.json({ success: true, message: 'Payment verified!' });
        } else {
            res.status(400).json({ success: false, error: 'Incorrect amount sent' });
        }
        
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check payment status
app.get('/api/payment-status/:paymentId', async (req, res) => {
    try {
        const { paymentId } = req.params;
        const paymentSnapshot = await db.ref('payments/' + paymentId).once('value');
        const payment = paymentSnapshot.val();
        
        res.json({
            success: true,
            status: payment?.status || 'not_found'
        });
        
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Payment server running on port ${PORT}`);
});
