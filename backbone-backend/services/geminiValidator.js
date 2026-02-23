const axios = require('axios');

const validateSolutionWithGemini = async (problem, solution) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`;

    const prompt = `You are an agricultural expert. Analyze this farming problem and solution.

Problem: ${problem}
Solution: ${solution}

Validate if the solution is:
1. Relevant to the problem
2. Scientifically correct
3. Safe for crops and environment
4. Practical for farmers

Respond ONLY with valid JSON in this exact format:
{"isValid": true, "score": 85, "reason": "Good solution for nitrogen deficiency"}

Score should be 0-100. isValid should be true if score >= 70.`;

    const response = await axios.post(url, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    const aiResponse = response.data.candidates[0].content.parts[0].text;
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return {
        isValid: result.isValid || false,
        score: result.score || 0,
        reason: result.reason || 'No reason provided'
      };
    }

    return { isValid: true, score: 50, reason: 'AI response format error' };
  } catch (error) {
    console.error('Gemini AI validation error:', error.response?.data || error.message);
    return { isValid: true, score: 50, reason: 'AI service unavailable' };
  }
};

module.exports = { validateSolutionWithGemini };
