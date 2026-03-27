const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Create audio directory if it doesn't exist
const audioDir = path.join(__dirname, '../public/audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const generateAudio = async (text, language = 'english') => {
  try {
    // Using Google Cloud Text-to-Speech API
    // You can also use other services like Amazon Polly, Azure TTS, etc.
    
    const languageCode = language === 'tamil' ? 'ta-IN' : 'en-US';
    const voiceName = language === 'tamil' ? 'ta-IN-Standard-A' : 'en-US-Standard-C';
    
    // If you have Google Cloud API key
    if (process.env.GOOGLE_TTS_API_KEY) {
      const response = await axios.post(
        `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TTS_API_KEY}`,
        {
          input: { text },
          voice: {
            languageCode,
            name: voiceName
          },
          audioConfig: {
            audioEncoding: 'MP3',
            speakingRate: 0.9,
            pitch: 0
          }
        }
      );

      const audioContent = response.data.audioContent;
      const fileName = `audio_${Date.now()}.mp3`;
      const filePath = path.join(audioDir, fileName);
      
      // Save audio file
      fs.writeFileSync(filePath, audioContent, 'base64');
      
      return {
        success: true,
        audioUrl: `/audio/${fileName}`,
        filePath
      };
    }
    
    // Fallback: Use browser's built-in speech synthesis (return text for client-side TTS)
    return {
      success: true,
      useBrowserTTS: true,
      text,
      language
    };
    
  } catch (error) {
    console.error('Audio generation error:', error.message);
    return {
      success: false,
      useBrowserTTS: true,
      text,
      language,
      error: error.message
    };
  }
};

module.exports = { generateAudio };
