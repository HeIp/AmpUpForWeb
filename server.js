import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// --- IMPORTANT: Set this environment variable or replace the placeholder ---
// This key is required for the Firebase Identity Toolkit API call.
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY || 'AIzaSyAe1Y-LLvODikdaf8orhmJAtUc-in0nKsE';

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
    console.log('--- START PROXY: /api/login ---');
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
        
        const ampupUrl = 'https://main.ampupapis.com/login';
        const headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Basic QkRqZ21IaUVxanlITWRKZTp3OG50WVZ1RkJUQU56ZXNi',
            'x-api-version': '2.9.2',
            'tz': '-300',
            'user-agent': 'ampUp/2.9.2',
            'accept-language': 'en',
        };

        // 💡 ENHANCED LOGGING - Request Details
        console.log('\n--- REQUEST DETAILS (AmpUp Login) ---');
        console.log('Endpoint:', ampupUrl);
        console.log('Headers:', headers);
        const logBody = { ...requestBody, password: '[REDACTED]' };
        console.log('Payload/Body:', logBody);
        console.log('-----------------------\n');

        const response = await fetch(ampupUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
        });

        console.log('AmpUp API response status:', response.status);
        
        const data = await response.json();
        console.log('AmpUp API response data:', data);

        // =======================================================
        // ✨ TOKEN EXCHANGE LOGIC START
        // =======================================================
        const customToken = data.data?.token;

        if (customToken && response.ok) {
            console.log('--- START FIREBASE TOKEN EXCHANGE ---');
            
            if (FIREBASE_API_KEY === '[INSERT_FIREBASE_WEB_API_KEY_HERE]') {
                console.error("❌ ERROR: FIREBASE_API_KEY is not set. Token exchange will fail.");
            }
            
            const exchangeUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`;
            
            const exchangeResponse = await fetch(exchangeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: customToken, // Token 1: The Firebase Admin/Custom Token
                    returnSecureToken: true
                })
            });

            const exchangeData = await exchangeResponse.json();
            console.log('Firebase Exchange Response Status:', exchangeResponse.status);
            
            if (exchangeResponse.ok && exchangeData.idToken) {
                console.log('Successfully exchanged for Access Token (Token 2).');
                
                // Set the final usable token in a new property (access_token)
                // so the frontend can retrieve it.
                data.data.access_token = exchangeData.idToken; 
                
                console.log('New Access Token Set:', exchangeData.idToken.substring(0, 40) + '...');
            } else {
                 console.error('Firebase token exchange failed:', exchangeData);
                 // The original data (with the unusable token) will be returned.
            }
        }
        // =======================================================
        // ✨ TOKEN EXCHANGE LOGIC END
        // =======================================================
        
        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy server error', details: error.message });
    } finally {
        console.log('--- END PROXY: /api/login ---\n');
    }
});

// Generic proxy for other AmpUp API calls (NO CHANGE NEEDED HERE)
app.use('/api/ampup', async (req, res) => {
    console.log(`--- START PROXY: /api/ampup${req.path} ---`);
    try {
        const ampupPath = req.path.substring(1); 
        const queryString = req.originalUrl.includes('?') ? req.originalUrl.substring(req.originalUrl.indexOf('?')) : '';
        const ampupUrl = `https://main.ampupapis.com/${ampupPath}${queryString}`;
        
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
        // ... (rest of the /api/ampup proxy is the same)
// ... (rest of the /api/ampup proxy is the same)

        const requestBody = req.method !== 'GET' && req.method !== 'HEAD' ? req.body : undefined;

        // 💡 ENHANCED LOGGING - Request Details
        console.log('\n--- REQUEST DETAILS ---');
        console.log('Method:', req.method);
        console.log('Target URL:', ampupUrl);
        console.log('Headers:', headers);
        if (requestBody) {
            console.log('Payload/Body:', requestBody);
        } else {
            console.log('Payload/Body: [None for this method]');
        }
        console.log('-----------------------\n');

        const response = await fetch(ampupUrl, {
            method: req.method,
            headers: headers,
            body: requestBody ? JSON.stringify(requestBody) : undefined,
        });

        console.log('AmpUp API response status:', response.status);

        // Safely handle non-JSON responses (as discussed in the previous response)
        const contentType = response.headers.get('content-type');
        let data;

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = {
                status: 'ERROR',
                message: `Non-JSON response received (Status: ${response.status}).`,
                raw_response: text.substring(0, 100) + '...'
            };
            console.error('Non-JSON Response Body (Text):', text.substring(0, 500));
        }

        console.log('AmpUp API response data:', data);

        res.status(response.status).json(data);
    } catch (error) {
        console.error('Proxy error:', error);
        res.status(500).json({ error: 'Proxy server error', details: error.message });
    } finally {
        console.log(`--- END PROXY: /api/ampup${req.path} ---\n`);
    }
});

app.listen(PORT, () => {
    console.log(`\n✅ AmpUp proxy server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health\n`);
}).on('error', (err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
});