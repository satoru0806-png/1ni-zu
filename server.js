const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db/database');
const authRoutes = require('./routes/auth');
const needsRoutes = require('./routes/needs');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/needs', needsRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`NI-ZU server running on http://localhost:${PORT}`);
});
