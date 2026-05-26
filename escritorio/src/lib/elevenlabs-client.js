async function elevenLabsGenerateSpeech(text, voiceId = "21m00Tcm4TlvDq8ikWAM") {
  const res = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + voiceId, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": process.env.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.5 },
    }),
  });

  if (!res.ok) throw new Error("ElevenLabs TTS Error: " + await res.text());
  return Buffer.from(await res.arrayBuffer());
}

module.exports = { elevenLabsGenerateSpeech };
