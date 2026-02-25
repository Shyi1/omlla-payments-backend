const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// ===== YOUR WALLET ADDRESS =====
const MERCHANT_WALLET = new PublicKey('9eEeSQAAoKtm4Tc8njVeKLoZc4cwMhB9yr1gVsENmQEx');

// ===== FIREBASE SETUP =====
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CERT_URL
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

// ===== SOLANA CONNECTION =====
const connection = new Connection('https://api.mainnet-beta.solana.com');

// ===== CREATE PAYMENT =====
app.post('/api/create-payment', async (req, res) => {
  try {
    const { userId, amount, packageName, solAmount } = req.body;
    
    const paymentId = 'pay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    await db.ref('payments/' + paymentId).set({
      userId,
      amount,
      packageName,
      solAmount,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour
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

// ===== VERIFY PAYMENT =====
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { paymentId, transactionSignature } = req.body;
    
    // Get payment details
    const paymentSnapshot = await db.ref('payments/' + paymentId).once('value');
    const payment = paymentSnapshot.val();
    
    if (!payment) {
      return res.status(404).json({ success: false, error: 'Payment not found' });
    }
    
    if (payment.status === 'completed') {
      return res.json({ success: true, message: 'Already completed' });
    }
    
    // Verify on Solana blockchain
    const tx = await connection.getTransaction(transactionSignature, {
      commitment: 'confirmed'
    });
    
    if (!tx) {
      return res.status(400).json({ success: false, error: 'Transaction not found' });
    }
    
    // Check if transaction sent to correct wallet
    let amountSent = 0;
    const postBalances = tx.meta.postBalances;
    const preBalances = tx.meta.preBalances;
    const accountKeys = tx.transaction.message.accountKeys;
    
    accountKeys.forEach((key, index) => {
      if (key.toString() === MERCHANT_WALLET.toString()) {
        amountSent = (postBalances[index] - preBalances[index]) / LAMPORTS_PER_SOL;
      }
    });
    
    // Verify amount (allow small margin)
    if (Math.abs(amountSent - payment.solAmount) < 0.001) {
      
      // Update payment status
      await db.ref('payments/' + paymentId).update({
        status: 'completed',
        transactionSignature,
        verifiedAt: Date.now()
      });
      
      // Add coins to user
      await db.ref('players/' + payment.userId).transaction(current => {
        if (current) {
          current.points = (current.points || 0) + payment.amount;
        }
        return current;
      });
      
      res.json({ success: true, message: 'Payment verified!' });
      
    } else {
      res.status(400).json({ 
        success: false, 
        error: `Incorrect amount: expected ${payment.solAmount} SOL, got ${amountSent} SOL` 
      });
    }
    
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ===== CHECK PAYMENT STATUS =====
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
  console.log(`🚀 Server running on port ${PORT}`);
});
