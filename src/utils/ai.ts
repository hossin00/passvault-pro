declare const __ANTHROPIC_KEY__: string;

const callClaude = async (prompt: string, system: string): Promise<string> => {
  const apiKey = typeof __ANTHROPIC_KEY__ !== 'undefined' ? __ANTHROPIC_KEY__ : '';
  if (!apiKey) return '⚠️ AI features unavailable.';
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 500,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await response.json();
    return data.content?.[0]?.text || '';
  } catch { return '⚠️ AI request failed.'; }
};

export const getAISuggestion = (context: string, type: string) => callClaude(
  context,
  `You are a helpful AI assistant for a \${type} app. Be concise, practical, and helpful. Max 3 sentences.`
);
