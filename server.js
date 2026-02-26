// ... (الأكواد السابقة للتعريف بـ Firebase)

// منطق الألعاب الموثوق (Backend Logic)
app.post('/api/play-game', async (req, res) => {
    try {
        const { userId, gameType, betAmount } = req.body;
        const bet = parseInt(betAmount);

        // 1. جلب بيانات اللاعب من Firebase
        const userSnap = await db.ref('players/' + userId).once('value');
        const userData = userSnap.val();

        if (!userData || userData.balance < bet) {
            return res.status(400).json({ success: false, message: 'Balance insufficient' });
        }

        let isWin = false;
        let multiplier = 0;

        // 2. حساب النتيجة بناءً على اللعبة
        switch(gameType) {
            case 'coinflip':
                isWin = Math.random() < 0.48; // نسبة ربح 48% (House Edge)
                multiplier = 2;
                break;
            case 'dice':
                const diceRoll = Math.floor(Math.random() * 6) + 1 + Math.floor(Math.random() * 6) + 1;
                isWin = [7, 11].includes(diceRoll);
                multiplier = 3;
                break;
            case 'crash':
                const crashPoint = (Math.random() * 2) + 0.5; // نقطة انفجار متغيرة
                isWin = Math.random() < 0.3; 
                multiplier = crashPoint;
                break;
        }

        // 3. تحديث الرصيد في السيرفر
        const winAmount = isWin ? Math.floor(bet * multiplier) : -bet;
        const newBalance = userData.balance + winAmount;

        await db.ref('players/' + userId).update({
            balance: newBalance,
            gamesPlayed: (userData.gamesPlayed || 0) + 1,
            biggestWin: Math.max(userData.biggestWin || 0, winAmount)
        });

        res.json({ 
            success: true, 
            isWin, 
            winAmount, 
            newBalance,
            resultData: isWin ? 'WINNER!' : 'LOST'
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
