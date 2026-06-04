export const pranwayuDefaultConfig = {
  BASE_URL: "https://rnd-pranvayu.excellonconnect.com/v3.0/",
  Subscription: "4cc780b5-36a1-4bff-b394-25965635cfc8",
  ClientId: "5bd61327-ca02-4d1a-9c25-641f162f3549",
  ClientSecret: "61c5368f-9fc4-4ab7-9f3f-c69f53775c5e",
  WS_BASE_URL: "wss://api-yuj.excellonconnect.com",
};

export const shrushtiDefaultConfig = {
  BASE_URL: "https://rnd-pranvayu.excellonconnect.com/v3.0/",
  Subscription: "4cc780b5-36a1-4bff-b394-25965635cfc8",
  ClientId: "5bd61327-ca02-4d1a-9c25-641f162f3549",
  ClientSecret: "61c5368f-9fc4-4ab7-9f3f-c69f53775c5e",
  WS_BASE_URL: "wss://api-yuj.excellonconnect.com",
};

// AI Assistant Configuration
export const aiAssistantConfig = {
  // OpenAI API Key - can be set via environment variable or localStorage
  // Set REACT_APP_OPENAI_API_KEY in .env file or use localStorage.setItem('OPENAI_API_KEY', 'your-key')
  OPENAI_API_KEY: process.env.REACT_APP_OPENAI_API_KEY || "",
  // Model to use (default: gpt-4o)
  AI_MODEL: process.env.REACT_APP_AI_MODEL || "gpt-4o",
};