const express = require('express');
const router = express.Router();
const { checkReputation } = require('../lib/reputation');
const { applyHeuristics } = require('../lib/heuristics');

router.post('/', async (req, res) => {
    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    let status = 'safe';
    let reasons = [];
    let trustScore = 100;

    const reputationResult = await checkReputation(url);
    if (reputationResult.isBlocked) {
        status = 'block';
        reasons.push('URL is on a known blocklist.');
        trustScore -= 90;
    }

    const heuristicsResult = applyHeuristics(url);
    if (heuristicsResult.length > 0) {
        if (status !== 'block') status = 'warn';
        reasons = [...reasons, ...heuristicsResult];
        trustScore -= heuristicsResult.length * 20;
    }

    if (reasons.length === 0) {
        reasons.push('No immediate threats detected.');
    }
    
    res.json({
        status,
        reasons,
        trust_score: Math.max(0, trustScore),
    });
});

module.exports = router;