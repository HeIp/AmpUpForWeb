import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for your frontend
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AmpUp proxy server is running' });
});

// Proxy endpoint for login
app.post('/api/login', async (req, res) => {
  console.log('Received login request:', { email: req.body.email });
  
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Generate a random device ID
    const deviceId = 'WEB-' + Math.random().toString(36).substring(2, 15);
    
    const requestBody = {
      email: email,
      password: password,
      device_id: deviceId,
      device_name: 'Web Browser',
      fcm_token: '',
      lat: 0,
      lng: 0,
    };
    
    console.log('Sending request to AmpUp API...');
    
    const response = await fetch('https://main.ampupapis.com/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Basic QkRqZ21IaUVxanlITWRKZTp3OG50WVZ1RkJUQU56ZXNi',
        'x-api-version': '2.9.2',
        'tz': '-300',
        'user-agent': 'ampUp/2.9.2',
        'accept-language': 'en',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('AmpUp API response status:', response.status);
    
    const data = await response.json();
    console.log('AmpUp API response data:', data);
    
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy server error', details: error.message });
  }
});

// Generic proxy for other AmpUp API calls
app.use('/api/ampup', async (req, res) => {
  try {
    const ampupPath = req.path.substring(1); // Remove leading /
    const ampupUrl = `https://main.ampupapis.com/${ampupPath}`;
    
    console.log(`Proxying ${req.method} request to:`, ampupUrl);
    
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': req.headers.authorization || 'Basic QkRqZ21IaUVxanlITWRKZTp3OG50WVZ1RkJUQU56ZXNi',
      'x-api-version': '2.9.2',
      'tz': '-300',
      'user-agent': 'ampUp/2.9.2',
      'accept-language': 'en',
    };

    const response = await fetch(ampupUrl, {
      method: req.method,
      headers: headers,
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: 'Proxy server error', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ AmpUp proxy server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health\n`);
}).on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});