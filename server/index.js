import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// iCal proxy endpoint
app.post('/fetch-ical', async (req, res) => {
  try {
    const { icalUrl } = req.body;

    if (!icalUrl) {
      return res.status(400).json({ error: 'icalUrl is required' });
    }

    const response = await fetch(icalUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch iCal data: ${response.statusText}`);
    }

    const icalData = await response.text();
    res.json({ data: icalData });
  } catch (error) {
    console.error('Error fetching iCal:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
