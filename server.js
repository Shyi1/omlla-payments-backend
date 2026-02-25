<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>OMLLA GAME | OFFICIAL</title>
    
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/9.22.1/firebase-database-compat.js"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            user-select: none;
            -webkit-tap-highlight-color: transparent;
        }

        :root {
            --primary: #14F195;
            --primary-dark: #0fa86a;
            --dark: #050505;
            --dark-light: #0f0f0f;
            --gray: #222;
            --text-gray: #888;
        }

        body {
            background: var(--dark);
            color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .container {
            width: 100%;
            max-width: 400px;
            padding: 20px;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
        }

        /* Header */
        .header {
            text-align: center;
        }

        .brand {
            font-size: 12px;
            letter-spacing: 4px;
            color: var(--text-gray);
            margin-bottom: 15px;
        }

        .balance-card {
            background: var(--dark-light);
            border-radius: 30px;
            padding: 25px;
            border: 1px solid var(--gray);
            margin-bottom: 10px;
        }

        .balance-label {
            font-size: 14px;
            color: var(--text-gray);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .balance-amount {
            font-size: 64px;
            font-weight: 900;
            color: var(--primary);
            line-height: 1.2;
            text-shadow: 0 0 30px rgba(20, 241, 149, 0.3);
        }

        .balance-currency {
            font-size: 18px;
            color: var(--text-gray);
            margin-left: 5px;
        }

        /* User Info */
        .user-info {
            background: var(--dark-light);
            border-radius: 50px;
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 10px;
            border: 1px solid var(--gray);
            margin: 15px 0;
        }

        .user-avatar {
            width: 40px;
            height: 40px;
            background: linear-gradient(45deg, var(--primary), #0fa86a);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 18px;
            color: black;
        }

        .user-details {
            flex: 1;
            text-align: left;
        }

        .user-name {
            font-weight: 600;
            font-size: 16px;
        }

        .user-id {
            font-size: 12px;
            color: var(--text-gray);
        }

        .user-level {
            background: var(--primary);
            color: black;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
        }

        /* Tap Area - NEW O$ STYLE */
        .tap-area {
            text-align: center;
            margin: 20px 0;
        }

        .coin-btn {
            width: 240px;
            height: 240px;
            margin: 0 auto;
            cursor: pointer;
            transition: all 0.1s ease;
            position: relative;
            background: radial-gradient(circle at 30% 30%, #14F195, #0a8a4a);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 0 50px rgba(20, 241, 149, 0.5);
        }

        .coin-btn:active {
            transform: scale(0.92);
        }

        .coin-symbol {
            font-size: 100px;
            font-weight: 900;
            color: black;
            text-shadow: 0 0 20px rgba(255,255,255,0.5);
            animation: float 3s ease-in-out infinite;
        }

        .coin-symbol span {
            font-size: 40px;
            margin-left: 5px;
        }

        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }

        /* Energy Bar */
        .energy-container {
            background: var(--dark-light);
            border-radius: 30px;
            padding: 20px;
            border: 1px solid var(--gray);
            margin: 20px 0;
        }

        .energy-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 14px;
        }

        .energy-bar-bg {
            width: 100%;
            height: 12px;
            background: var(--gray);
            border-radius: 50px;
            overflow: hidden;
        }

        .energy-bar-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--primary), #14F195);
            border-radius: 50px;
            transition: width 0.3s ease;
            width: 100%;
        }

        /* Boost Section - ADDED REFERRAL BUTTON */
        .boost-section {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 8px;
            margin: 15px 0;
        }

        .boost-btn {
            background: var(--dark-light);
            border: 1px solid var(--gray);
            border-radius: 20px;
            padding: 12px 5px;
            color: white;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            font-size: 13px;
        }

        .boost-btn i {
            color: var(--primary);
        }

        .boost-btn:active {
            background: var(--gray);
            transform: scale(0.95);
        }

        .boost-btn.primary {
            background: var(--primary);
            color: black;
            border: none;
        }

        .boost-btn.primary i {
            color: black;
        }

        .boost-btn.referral {
            background: linear-gradient(145deg, #14F19520, #000);
            border-color: var(--primary);
        }

        /* Stats Grid */
        .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin: 15px 0;
        }

        .stat-card {
            background: var(--dark-light);
            border: 1px solid var(--gray);
            border-radius: 20px;
            padding: 15px;
            text-align: center;
        }

        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: var(--primary);
        }

        .stat-label {
            font-size: 12px;
            color: var(--text-gray);
            margin-top: 5px;
        }

        /* Footer */
        .footer {
            text-align: center;
            font-size: 11px;
            color: var(--text-gray);
            padding: 15px 0;
        }

        .status {
            color: var(--primary);
            margin-bottom: 5px;
        }

        .debug-log {
            color: #ff4444;
            font-size: 10px;
            word-break: break-word;
        }

        /* Modal */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            z-index: 1000;
            justify-content: center;
            align-items: center;
        }

        .modal.active {
            display: flex;
        }

        .modal-content {
            background: var(--dark-light);
            border-radius: 30px;
            padding: 30px;
            max-width: 300px;
            border: 1px solid var(--gray);
        }

        .modal-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 20px;
            color: var(--primary);
        }

        .topup-option {
            background: var(--dark);
            border: 1px solid var(--gray);
            border-radius: 15px;
            padding: 15px;
            margin: 10px 0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
        }

        .topup-option:active {
            background: var(--gray);
        }

        .topup-amount {
            font-weight: bold;
            color: var(--primary);
        }

        .close-modal {
            margin-top: 20px;
            background: none;
            border: 1px solid var(--gray);
            color: white;
            padding: 12px;
            border-radius: 25px;
            width: 100%;
            cursor: pointer;
        }

        /* Simple Toast */
        .toast {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: var(--primary);
            color: black;
            padding: 10px 20px;
            border-radius: 50px;
            font-weight: bold;
            display: none;
            z-index: 2000;
        }
        
        .toast.show {
            display: block;
        }
    </style>
</head>
<body>

    <div class="container">
        <!-- Header -->
        <div class="header">
            <div class="brand">⚡ OMLLA CAPITAL ⚡</div>
            
            <!-- Balance Card - Changed to O$ -->
            <div class="balance-card">
                <div class="balance-label">Total Balance</div>
                <div class="balance-amount">
                    <span id="balance-display">0</span>
                    <span class="balance-currency">O$</span>
                </div>
            </div>

            <!-- User Info -->
            <div class="user-info" id="user-info">
                <div class="user-avatar" id="user-avatar">👤</div>
                <div class="user-details">
                    <div class="user-name" id="user-name">Loading...</div>
                    <div class="user-id" id="user-id">ID: -</div>
                </div>
                <div class="user-level" id="user-level">Beginner</div>
            </div>
        </div>

        <!-- Tap Area - NEW O$ COIN -->
        <div class="tap-area">
            <div class="coin-btn" id="tap-button">
                <div class="coin-symbol">O<span>$</span></div>
            </div>
        </div>

        <!-- Energy Bar -->
        <div class="energy-container">
            <div class="energy-header">
                <span><i class="fas fa-bolt" style="color: #14F195;"></i> Energy</span>
                <span id="energy-display">1000/1000</span>
            </div>
            <div class="energy-bar-bg">
                <div class="energy-bar-fill" id="energy-fill" style="width: 100%"></div>
            </div>
        </div>

        <!-- Boost Section - ADDED REFERRAL BUTTON -->
        <div class="boost-section">
            <button class="boost-btn" id="refill-energy">
                <i class="fas fa-bolt"></i> Refill
            </button>
            <button class="boost-btn primary" id="show-topup">
                <i class="fas fa-coins"></i> Top Up
            </button>
            <button class="boost-btn referral" id="referral-btn">
                <i class="fas fa-users"></i> Refer
            </button>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value" id="total-taps">0</div>
                <div class="stat-label">Total Taps</div>
            </div>
            <div class="stat-card">
                <div class="stat-value" id="referral-count">0</div>
                <div class="stat-label">Referrals</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <div class="status" id="connection-status">Connecting to network...</div>
            <div class="debug-log" id="debug-log"></div>
            <div>© 2024 OMLLA GAME</div>
        </div>
    </div>

    <!-- Top Up Modal - Changed to O$ -->
    <div class="modal" id="topup-modal">
        <div class="modal-content">
            <div class="modal-title">💰 Top Up O$</div>
            
            <div class="topup-option" data-amount="100">
                <span>100 O$</span>
                <span class="topup-amount">$1.00</span>
            </div>
            
            <div class="topup-option" data-amount="500">
                <span>500 O$</span>
                <span class="topup-amount">$4.50</span>
            </div>
            
            <div class="topup-option" data-amount="1000">
                <span>1,000 O$</span>
                <span class="topup-amount">$8.00</span>
            </div>
            
            <div class="topup-option" data-amount="5000">
                <span>5,000 O$</span>
                <span class="topup-amount">$35.00</span>
            </div>
            
            <button class="close-modal" id="close-modal">Cancel</button>
        </div>
    </div>

    <!-- Simple Toast -->
    <div class="toast" id="toast">Copied!</div>

    <script>
        (function() {
            'use strict';

            // ==================== TELEGRAM INIT ====================
            const tg = window.Telegram.WebApp;
            tg.expand();
            tg.enableClosingConfirmation();

            // ==================== FIREBASE CONFIG ====================
            const firebaseConfig = {
                databaseURL: "https://omlla-game-default-rtdb.firebaseio.com"
            };

            // ==================== DOM ELEMENTS ====================
            const elements = {
                balance: document.getElementById('balance-display'),
                energy: document.getElementById('energy-display'),
                energyFill: document.getElementById('energy-fill'),
                userName: document.getElementById('user-name'),
                userId: document.getElementById('user-id'),
                userAvatar: document.getElementById('user-avatar'),
                userLevel: document.getElementById('user-level'),
                totalTaps: document.getElementById('total-taps'),
                referralCount: document.getElementById('referral-count'),
                connectionStatus: document.getElementById('connection-status'),
                debugLog: document.getElementById('debug-log'),
                tapButton: document.getElementById('tap-button'),
                refillBtn: document.getElementById('refill-energy'),
                showTopup: document.getElementById('show-topup'),
                referralBtn: document.getElementById('referral-btn'),
                topupModal: document.getElementById('topup-modal'),
                closeModal: document.getElementById('close-modal'),
                toast: document.getElementById('toast')
            };

            // ==================== GAME VARIABLES ====================
            let player = {
                id: null,
                name: 'Guest',
                points: 0,
                energy: 1000,
                maxEnergy: 1000,
                totalTaps: 0,
                referrals: 0,
                lastUpdate: Date.now()
            };

            let db = null;
            let userRef = null;

            // ==================== UTILITY FUNCTIONS ====================
            function formatNumber(num) {
                return num.toLocaleString();
            }

            function showToast(message) {
                elements.toast.textContent = message;
                elements.toast.classList.add('show');
                setTimeout(() => {
                    elements.toast.classList.remove('show');
                }, 2000);
            }

            function updateUI() {
                elements.balance.textContent = formatNumber(Math.floor(player.points));
                elements.energy.textContent = `${Math.floor(player.energy)}/${player.maxEnergy}`;
                elements.energyFill.style.width = `${(player.energy / player.maxEnergy) * 100}%`;
                elements.totalTaps.textContent = formatNumber(player.totalTaps);
                elements.referralCount.textContent = player.referrals;

                // Update level based on points
                if (player.points < 100) {
                    elements.userLevel.textContent = '🐣 Beginner';
                } else if (player.points < 1000) {
                    elements.userLevel.textContent = '🌱 Bronze';
                } else if (player.points < 5000) {
                    elements.userLevel.textContent = '🌿 Silver';
                } else if (player.points < 10000) {
                    elements.userLevel.textContent = '🔥 Gold';
                } else {
                    elements.userLevel.textContent = '👑 Platinum';
                }
            }

            function logDebug(message, isError = false) {
                console.log(message);
                if (isError) {
                    elements.debugLog.textContent = `Error: ${message}`;
                }
            }

            // ==================== REFERRAL FUNCTIONS ====================
            function getReferralLink() {
                // CHANGE THIS TO YOUR BOT USERNAME
                const botUsername = "OMLLA_COIN_bot"; 
                return `https://t.me/${botUsername}?start=${player.id}`;
            }

            function shareReferral() {
                const link = getReferralLink();
                
                // Copy to clipboard
                navigator.clipboard.writeText(link).then(() => {
                    showToast('✅ Link copied!');
                    
                    // Try to open share dialog
                    if (tg.shareToStory) {
                        // For Telegram
                        tg.shareToStory(link);
                    } else {
                        // Fallback
                        tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=Join me on OMLLA Game!`);
                    }
                    
                    if (tg.HapticFeedback) {
                        tg.HapticFeedback.notificationOccurred('success');
                    }
                }).catch(err => {
                    logDebug('Copy failed', true);
                });
            }

            // ==================== FIREBASE FUNCTIONS ====================
            function initFirebase() {
                try {
                    if (!firebase.apps.length) {
                        firebase.initializeApp(firebaseConfig);
                    }
                    db = firebase.database();
                    
                    // Get user data from Telegram
                    const tgUser = tg.initDataUnsafe?.user;
                    
                    if (tgUser) {
                        player.id = tgUser.id;
                        player.name = tgUser.first_name;
                        if (tgUser.last_name) {
                            player.name += ' ' + tgUser.last_name;
                        }
                        
                        elements.userName.textContent = player.name;
                        elements.userId.textContent = `ID: ${player.id}`;
                        
                        // Set avatar
                        if (tgUser.photo_url) {
                            elements.userAvatar.innerHTML = `<img src="${tgUser.photo_url}" style="width:40px;height:40px;border-radius:50%;">`;
                        } else {
                            elements.userAvatar.textContent = player.name.charAt(0).toUpperCase();
                        }
                    } else {
                        // Test user for development
                        player.id = 'test_' + Math.floor(Math.random() * 1000000);
                        player.name = 'Test User';
                        elements.userName.textContent = player.name;
                        elements.userId.textContent = `ID: ${player.id}`;
                    }

                    // Reference to player data
                    userRef = db.ref('players/' + player.id);

                    // Connection status
                    db.ref('.info/connected').on('value', (snap) => {
                        if (snap.val() === true) {
                            elements.connectionStatus.innerHTML = '✅ Connected';
                            elements.connectionStatus.style.color = '#14F195';
                        } else {
                            elements.connectionStatus.innerHTML = '⚠️ Offline';
                            elements.connectionStatus.style.color = '#ffaa00';
                        }
                    });

                    // Load player data
                    userRef.on('value', (snapshot) => {
                        const data = snapshot.val();
                        if (data) {
                            player.points = data.points || 0;
                            player.energy = data.energy ?? player.maxEnergy;
                            player.totalTaps = data.totalTaps || 0;
                            player.referrals = data.referrals || 0;
                            updateUI();
                        }
                        logDebug('Data loaded successfully');
                    }, (error) => {
                        logDebug(error.message, true);
                    });

                } catch (error) {
                    logDebug(error.message, true);
                }
            }

            function saveToFirebase() {
                if (!userRef) return;
                
                const dataToSave = {
                    points: player.points,
                    energy: player.energy,
                    totalTaps: player.totalTaps,
                    name: player.name,
                    referrals: player.referrals,
                    lastUpdate: Date.now()
                };
                
                userRef.set(dataToSave).catch(error => {
                    logDebug(error.message, true);
                });
            }

            // ==================== GAME FUNCTIONS ====================
            function handleTap() {
                if (player.energy >= 1) {
                    player.points += 1;
                    player.energy -= 1;
                    player.totalTaps += 1;
                    
                    updateUI();
                    
                    if (tg.HapticFeedback) {
                        tg.HapticFeedback.impactOccurred('light');
                    }
                    
                    saveToFirebase();
                } else {
                    if (tg.HapticFeedback) {
                        tg.HapticFeedback.notificationOccurred('warning');
                    }
                    
                    elements.energyFill.style.background = '#ff4444';
                    setTimeout(() => {
                        elements.energyFill.style.background = 'linear-gradient(90deg, #14F195, #14F195)';
                    }, 300);
                }
            }

            function refillEnergy() {
                player.energy = player.maxEnergy;
                updateUI();
                saveToFirebase();
                
                if (tg.HapticFeedback) {
                    tg.HapticFeedback.notificationOccurred('success');
                }
            }

            function topUp(amount) {
                player.points += amount;
                updateUI();
                saveToFirebase();
                
                elements.topupModal.classList.remove('active');
                
                if (tg.HapticFeedback) {
                    tg.HapticFeedback.notificationOccurred('success');
                }
                
                elements.connectionStatus.innerHTML = `✅ Added ${amount} O$!`;
                elements.connectionStatus.style.color = '#14F195';
                setTimeout(() => {
                    elements.connectionStatus.innerHTML = '✅ Connected';
                }, 2000);
            }

            // ==================== ENERGY REGEN ====================
            function startEnergyRegen() {
                setInterval(() => {
                    if (player.energy < player.maxEnergy) {
                        player.energy = Math.min(player.energy + 1, player.maxEnergy);
                        updateUI();
                        saveToFirebase();
                    }
                }, 2000);
            }

            // ==================== EVENT LISTENERS ====================
            function initEventListeners() {
                // Tap button
                elements.tapButton.addEventListener('click', (e) => {
                    e.preventDefault();
                    handleTap();
                });
                
                elements.tapButton.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                });

                // Refill energy
                elements.refillBtn.addEventListener('click', () => {
                    refillEnergy();
                });

                // Show top up modal
                elements.showTopup.addEventListener('click', () => {
                    elements.topupModal.classList.add('active');
                });

                // Referral button
                elements.referralBtn.addEventListener('click', () => {
                    shareReferral();
                });

                // Close modal
                elements.closeModal.addEventListener('click', () => {
                    elements.topupModal.classList.remove('active');
                });

                // Top up options
                document.querySelectorAll('.topup-option').forEach(option => {
                    option.addEventListener('click', () => {
                        const amount = parseInt(option.dataset.amount);
                        topUp(amount);
                    });
                });

                // Close modal by clicking outside
                elements.topupModal.addEventListener('click', (e) => {
                    if (e.target === elements.topupModal) {
                        elements.topupModal.classList.remove('active');
                    }
                });
            }

            // ==================== INITIALIZATION ====================
            function init() {
                try {
                    initFirebase();
                    initEventListeners();
                    startEnergyRegen();
                    updateUI();
                    
                    window.addEventListener('beforeunload', () => {
                        saveToFirebase();
                    });
                    
                } catch (error) {
                    logDebug(error.message, true);
                }
            }

            // Start the game
            init();

        })();
    </script>
</body>
</html>
