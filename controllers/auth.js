const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/UserModel'); // We'll create this file next





const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const userExists = await User.findOne({ email: email.toLowerCase() });
  if (userExists) return res.status(400).json({ message: 'User already exists' });

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    email: email.toLowerCase(),
    password: hashedPassword
  });

  await newUser.save();

  res.status(201).json({ message: 'User registered successfully' });
};




// Login a user and return token
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log('🔐 Login request received:', email); // Step 1

    const formattedEmail = email.toLowerCase();
    console.log('📬 Searching for user with email:', formattedEmail); // Step 2

    const user = await User.findOne({ email: formattedEmail });

    if (!user) {
      console.log('❌ User not found in DB');
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('✅ User found:', user.username); // Step 3

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Password does not match');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });

    console.log('✅ Token generated successfully');
    res.json({ token });
  } catch (err) {
    console.error('💥 Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// Get user profile (after auth)
const getUserProfile = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: No user ID in request' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user,
    });
  } catch (err) {
    console.error('❌ Error fetching profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};
