const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const BOT_TOKEN = process.env.BOT_TOKEN;

app.post('/create-invoice', async (req, res) => {
    try {
        const { amount, userId } = req.body;
        
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/createInvoiceLink`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: "OMLLA Coins",
                description: `Purchase ${amount} O$ coins`,
                payload: `${userId}_${Date.now()}`,
                currency: "XTR",
                prices: [{ label: "OMLLA Coins", amount: amount }]
            })
        });
        
        const data = await response.json();
        
        if (data.ok) {
            res.json({ success: true, invoiceUrl: data.result });
        } else {
            res.json({ success: false, error: data.description });
        }
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.get('/', (req, res) => {
    res.send('OMLLA Payment Server Running');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});