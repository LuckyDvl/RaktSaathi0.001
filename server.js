// server.js
const express = require('express');
const multer  = require('multer');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// In-memory arrays
let donors = [];
let requests = [];
let users = []; // Each user: { id, username, password, role, fullName, bio }
let messages = []; // Each message: { id, senderId, receiverId, type: 'text'|'image', content, timestamp, read }
let sessions = {}; // sessions[token] = { userId, expiresAt }

// Pre-populate default users with profile info
users.push({
  id: 1,
  username: "errorTeam",
  password: "123",
  role: "donor",
  fullName: "Error Team One",
  bio: "Default account for ErrorTeam."
});
users.push({
  id: 2,
  username: "errorTeam2",
  password: "123",
  role: "donor",
  fullName: "Error Team Two",
  bio: "Second default account."
});

// Token lifetime (30 minutes)
const TOKEN_LIFETIME = 30 * 60 * 1000;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* 
  IMPORTANT: Define all API endpoints before serving static files.
*/

// ----- AUTH & PROFILE ENDPOINTS -----
// Sign up – creates account with profile info
app.post('/api/signup', (req, res) => {
  const { username, password, role, fullName, bio } = req.body;
  if (!username || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ error: 'Username already exists' });
  }
  const newUser = { 
    id: users.length + 1, 
    username, 
    password, 
    role, 
    fullName: fullName || "", 
    bio: bio || "" 
  };
  users.push(newUser);
  res.status(201).json({ message: "Signup successful", user: newUser });
});

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Missing credentials' });
  const user = users.find(u => u.username === username && u.password === password);
  if (!user)
    return res.status(401).json({ error: 'Invalid credentials' });
  const token = crypto.randomBytes(16).toString('hex');
  sessions[token] = { userId: user.id, expiresAt: Date.now() + TOKEN_LIFETIME };
  res.json({ message: "Login successful", token, user });
});

// Middleware: authenticate
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  if (!token || !sessions[token])
    return res.status(401).json({ error: 'Invalid token' });
  const session = sessions[token];
  if (Date.now() > session.expiresAt) {
    delete sessions[token];
    return res.status(401).json({ error: 'Token expired' });
  }
  req.userId = session.userId;
  next();
}

// Refresh token
app.post('/api/refresh', authenticate, (req, res) => {
  const oldToken = req.headers.authorization.split(' ')[1];
  const userId = sessions[oldToken].userId;
  const newToken = crypto.randomBytes(16).toString('hex');
  sessions[newToken] = { userId, expiresAt: Date.now() + TOKEN_LIFETIME };
  delete sessions[oldToken];
  res.json({ message: "Token refreshed", token: newToken });
});

// Get current user's profile
app.get('/api/user/profile', authenticate, (req, res) => {
  const user = users.find(u => u.id === req.userId);
  if (!user)
    return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Update current user's profile
app.put('/api/user/profile', authenticate, (req, res) => {
  const { fullName, bio } = req.body;
  const user = users.find(u => u.id === req.userId);
  if (!user)
    return res.status(404).json({ error: 'User not found' });
  user.fullName = fullName || "";
  user.bio = bio || "";
  res.json({ message: "Profile updated successfully", user });
});

// Get all users except current (for chat sidebar)
app.get('/api/users', authenticate, (req, res) => {
  const otherUsers = users.filter(u => u.id !== req.userId);
  res.json(otherUsers);
});

// Look up a user by username (case-insensitive)
app.get('/api/user', (req, res) => {
  const { username } = req.query;
  if (!username)
    return res.status(400).json({ error: 'Missing username parameter' });
  const found = users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (!found)
    return res.status(404).json({ error: 'User not found' });
  res.json(found);
});

// ----- DONORS & REQUESTS -----
app.get('/api/donors', (req, res) => res.json(donors));
app.post('/api/donors', upload.single('profilePic'), (req, res) => {
  const { name, fatherName, age, gender, mobile, email, bloodGroup, street, district, state, pinCode, altMobile, previouslyDonated, healthIssues, userId } = req.body;
  if (!name || !fatherName || !age || !gender || !mobile || !bloodGroup || !street || !district || !state || !pinCode || !previouslyDonated) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const newDonor = {
    id: donors.length + 1,
    name, fatherName, age, gender, mobile,
    email: email || "",
    bloodGroup,
    address: { street, district, state, pinCode, altMobile: altMobile || "" },
    previouslyDonated,
    healthIssues: healthIssues || "",
    profilePic: req.file ? req.file.path : "",
    createdBy: userId || null
  };
  donors.push(newDonor);
  res.status(201).json(newDonor);
});

app.get('/api/requests', (req, res) => res.json(requests));
app.post('/api/requests', upload.fields([
  { name: 'reportsImages', maxCount: 5 },
  { name: 'video', maxCount: 1 }
]), (req, res) => {
  const { name, fatherName, age, gender, bloodGroup, mobile, email, street, district, state, pinCode, altMobile, emergency, userId } = req.body;
  if (!name || !fatherName || !age || !gender || !mobile || !bloodGroup || !street || !district || !state || !pinCode || !emergency) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  let reportsImages = [];
  if (req.files['reportsImages']) {
    reportsImages = req.files['reportsImages'].map(file => file.path);
  }
  let video = "";
  if (req.files['video'] && req.files['video'][0]) {
    video = req.files['video'][0].path;
  }
  const newRequest = {
    id: requests.length + 1,
    name, fatherName, age, gender, bloodGroup, mobile,
    email: email || "",
    address: { street, district, state, pinCode, altMobile: altMobile || "" },
    emergency,
    reportsImages,
    video,
    createdBy: userId || null
  };
  requests.push(newRequest);
  res.status(201).json(newRequest);
});

// ----- MESSAGES -----
const msgUpload = upload.single('imageFile');
app.post('/api/messages', authenticate, (req, res) => {
  msgUpload(req, res, function(err) {
    if (err) return res.status(400).json({ error: 'File upload error' });
    const { receiverId, content } = req.body;
    if (!receiverId) return res.status(400).json({ error: 'Missing receiverId' });
    let msgType = 'text';
    let msgContent = content || "";
    if (req.file) {
      msgType = 'image';
      msgContent = req.file.path;
    } else if (!msgContent) {
      return res.status(400).json({ error: 'No content provided' });
    }
    const newMessage = {
      id: messages.length + 1,
      senderId: req.userId,
      receiverId: parseInt(receiverId),
      type: msgType,
      content: msgContent,
      timestamp: new Date(),
      read: false
    };
    messages.push(newMessage);
    res.status(201).json(newMessage);
  });
});

app.get('/api/messages', authenticate, (req, res) => {
  const { withUserId } = req.query;
  if (!withUserId)
    return res.status(400).json({ error: 'Missing withUserId parameter' });
  const conv = messages.filter(m =>
    (m.senderId === req.userId && m.receiverId === parseInt(withUserId)) ||
    (m.senderId === parseInt(withUserId) && m.receiverId === req.userId)
  );
  // Mark messages sent to current user as read
  conv.forEach(m => { if (m.receiverId === req.userId) m.read = true; });
  res.json(conv);
});

// New endpoint: Get unread message counts grouped by sender
app.get('/api/messages/unread', authenticate, (req, res) => {
  const unreadCounts = {};
  messages.forEach(m => {
    if (m.receiverId === req.userId && !m.read) {
      unreadCounts[m.senderId] = (unreadCounts[m.senderId] || 0) + 1;
    }
  });
  res.json(unreadCounts);
});

// Cleanup expired tokens every minute
setInterval(() => {
  const now = Date.now();
  for (const t in sessions) {
    if (sessions[t].expiresAt < now) delete sessions[t];
  }
}, 60 * 1000);

// Serve static files and uploads
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
