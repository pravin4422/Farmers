const Groq = require('groq-sdk');

const validateSolutionWithGroq = async (problem, solution) => {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are an expert agricultural scientist. Analyze this farming problem and solution critically.

Problem: ${problem}
Solution: ${solution}

Score the solution from 0-100 based on:
1. Completeness (25 points): Does it cover immediate actions, root cause, prevention?
2. Specificity (25 points): Specific measurements, timelines, dosages?
3. Scientific accuracy (25 points): Correct diagnosis and treatment?
4. Practicality (25 points): Affordable, safe, easy to implement?

Scoring guide:
- 90-100: Exceptional - Complete, specific, scientific, with timeline and prevention
- 70-89: Good - Addresses problem well with specific details
- 50-69: Average - Basic advice, lacks detail or specificity
- 30-49: Poor - Vague or incomplete
- 0-29: Bad - Wrong, harmful, or irrelevant

Respond ONLY with valid JSON:
{"isValid": true, "score": 85, "reason": "Brief reason"}

isValid should be true if score >= 70.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 200
    });

    const aiResponse = completion.choices[0]?.message?.content || '';
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isValid: parsed.isValid || false,
        score: parsed.score || 0,
        reason: parsed.reason || 'No reason provided'
      };
    }

    return { isValid: true, score: 50, reason: 'AI response format error' };
  } catch (error) {
    console.error('Groq AI validation error:', error.message);
    return { isValid: true, score: 50, reason: 'AI service unavailable' };
  }
};

module.exports = { validateSolutionWithGroq };
