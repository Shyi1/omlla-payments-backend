const admin = require('firebase-admin');
const { GoogleGenerativeAI } = require("@google/generative-ai");

admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_CONFIG)),
  databaseURL: process.env.DATABASE_URL
});

const db = admin.database();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function autonomousDecisionCore() {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const snap = await db.ref('system_metrics').once('value');
    const metrics = snap.val() || { total_payouts: 0, reserve: 1000 };

    const prompt = `System Analytics: ${JSON.stringify(metrics)}. 
    Task: Optimize Global Profit Engine. Return JSON only: {multiplier, energyDrain, securityLevel}.`;

    try {
        const result = await model.generateContent(prompt);
        const config = JSON.parse(result.response.text());
        await db.ref('engine_config').set(config);
    } catch (e) {
        await db.ref('engine_config').set({multiplier: 1, energyDrain: 0.05, securityLevel: "HIGH"});
    }
}

function executionLoop() {
    setInterval(async () => {
        const playersRef = db.ref('players');
        const snap = await playersRef.once('value');
        const players = snap.val();
        if (!players) return;

        const configSnap = await db.ref('engine_config').once('value');
        const config = configSnap.val();

        let batchUpdates = {};
        for (let id in players) {
            let p = players[id];
            if (p.energy > 0) {
                batchUpdates[`${id}/balance`] = (p.balance || 0) + (0.01 * (p.lvl || 1) * config.multiplier);
                batchUpdates[`${id}/energy`] = Math.max(0, p.energy - config.energyDrain);
            }
        }
        await playersRef.update(batchUpdates);
    }, 1000);
}

executionLoop();
setInterval(autonomousDecisionCore, 300000);
