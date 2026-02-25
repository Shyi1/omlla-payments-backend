<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>OMLLA GOLD | PRESTIGE</title>
    
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-database-compat.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; user-select: none; -webkit-tap-highlight-color: transparent; }
        
        :root {
            --gold: #FFD700;
            --gold-glow: rgba(255, 215, 0, 0.4);
            --emerald: #14F195;
            --dark-bg: #050505;
        }

        body {
            background: var(--dark-bg);
            color: white;
            font-family: 'Segoe UI', Roboto, sans-serif;
            height: 100vh;
            display: flex;
            justify-content: center;
            overflow: hidden;
        }

        .container {
            width: 100%;
            max-width: 400px;
            padding: 25px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: radial-gradient(circle at center, #1a1a0a 0%, #050505 100%);
        }

        /* Branding Gold */
        .header { text-align: center; }
        .brand-logo { font-size: 10px; letter-spacing: 6px; color: var(--gold); font-weight: 900; margin-bottom: 15px; }
        
        .balance-box {
            background: rgba(255, 215, 0, 0.05);
            border: 1px solid rgba(255, 215, 0, 0.2);
            border-radius: 25px;
            padding: 20px;
            margin-bottom: 20px;
        }
        .balance-val {
            font-size: 60px;
            font-weight: 900;
            color: var(--gold);
            text-shadow: 0 0 25px var(--gold-glow);
        }

        /* The Gold Coin Design */
        .tap-section { flex-grow: 1; display: flex; justify-content: center; align-items: center; }
        
        .gold-omlla-coin {
            width: 260px;
            height: 260px;
            border-radius: 50%;
            background: linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c);
            border: 8px solid #8a6d3b;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            cursor: pointer;
            box-shadow: 0 0 50px rgba(186, 141, 10, 0.3), inset 0 0 20px rgba(0,0,0,0.2);
            transition: transform 0.05s ease;
        }

        .gold-omlla-coin:active { transform: scale(0.92) rotateX(10deg); }
        
        .coin-inner-text {
            font-size: 50px;
            font-weight: 900;
            color: #4a3505;
            letter-spacing: -2px;
            font-family: serif;
        }

        /* Stats Bar */
        .stamina-card {
            background: #111;
            padding: 15px;
            border-radius: 20px;
            border-left: 4px solid var(--gold);
        }
        .progress-bar {
            height: 6px;
            background: #222;
            border-radius: 10px;
            margin-top: 10px;
            overflow: hidden;
        }
        .progress-fill { height: 100%; background: var(--gold); width: 100%; transition: width 0.2s; }

        /* Floating Particles */
        .tap-popup {
            position: absolute; color: var(--gold); font-weight: 900; font-size: 32px;
            pointer-events: none; animation: floatUp 0.8s ease-out forwards;
        }
        @keyframes floatUp { 0% { opacity: 1; transform: translateY(0); } 100% { opacity: 0; transform: translateY(-130px); } }

        .footer-text { font-size: 10px; color: #444; text-align: center; margin-top: 10px; }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <div class="brand-logo">OMLLA GOLD CAPITAL</div>
        <div class="balance-box">
            <div style="font-size: 11px; color: #8a6d3b; margin-bottom: 5px;">ACCOUNT BALANCE</div>
            <div class="balance-val" id="balance-display">0</div>
            <div style="color: var(--emerald); font-size: 12px; font-weight: bold;">PRESTIGE STATUS: ACTIVE</div>
        </div>
    </div>

    <div class="tap-section">
        <div class="gold-omlla-coin" id="coin-trigger">
            <div class="coin-inner-text">OMLLA</div>
        </div>
    </div>

    <div>
        <div class="stamina-card">
            <div style="display:flex; justify-content:space-between; font-size:12px;">
                <span>STAMINA RESERVE</span>
                <span id="stamina-text">1000/1000</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" id="stamina-fill"></div>
            </div>
        </div>
        
        <div class="footer-text">
            <span id="sync-status">SECURE CONNECTION ESTABLISHED</span><br>
            © 2026 OMLLA INTERNATIONAL
        </div>
    </div>
</div>

<script>
    const tg = window.Telegram.WebApp;
    tg.expand();

    // Firebase (رابطك الخاص)
    const firebaseConfig = { databaseURL: "https://omlla-game-default-rtdb.firebaseio.com" };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();

    const user = tg.initDataUnsafe.user || { id: "admin_test", first_name: "Master" };
    const userRef = db.ref('players/' + user.id);

    let points = 0;
    let energy = 1000;

    function refreshUI() {
        document.getElementById('balance-display').innerText = Math.floor(points).toLocaleString();
        document.getElementById('stamina-text').innerText = `${energy}/1000`;
        document.getElementById('stamina-fill').style.width = (energy / 10) + "%";
    }

    // Sync Data
    userRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            points = data.points || 0;
            energy = data.energy ?? 1000;
            refreshUI();
        } else {
            // First time setup (Satisfies Rule)
            userRef.set({ points: 0, name: user.first_name, energy: 1000 });
        }
    });

    // Tap Engine
    document.getElementById('coin-trigger').addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (energy > 0) {
            points += 1;
            energy -= 1;
            refreshUI();

            // Create Particle
            const touch = e.touches[0];
            const p = document.createElement('div');
            p.className = 'tap-popup'; p.innerText = '+1';
            p.style.left = touch.clientX + 'px'; p.style.top = touch.clientY + 'px';
            document.body.appendChild(p);
            setTimeout(() => p.remove(), 800);

            if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');

            // Atomic Update (Rule Compliant)
            userRef.update({
                points: points,
                name: user.first_name,
                energy: energy
            });
        }
    });

    // Energy Regen
    setInterval(() => {
        if (energy < 1000) {
            energy += 1;
            refreshUI();
        }
    }, 3000);

</script>
</body>
</html>
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);

});
