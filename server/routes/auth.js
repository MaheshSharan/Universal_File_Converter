const express = require('express');
const router = express.Router();
const { oauth2Client, getAuthUrl, getUserInfo } = require('../config/googleAuth');

// Get Google OAuth URL
router.get('/google/url', (req, res) => {
  try {
    const url = getAuthUrl();
    res.json({ url });
  } catch (error) {
    console.error('[AUTH] Error generating auth URL:', error);
    res.status(500).json({ error: 'Failed to generate auth URL' });
  }
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    console.log('[AUTH] Processing OAuth callback');
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    
    // Get user info
    const userInfo = await getUserInfo(tokens);
    console.log('[AUTH] User authenticated:', userInfo.email);
    
    // Store in session
    req.session.tokens = tokens;
    req.session.user = userInfo;
    
    res.redirect(process.env.CLIENT_URL);
  } catch (error) {
    console.error('[AUTH] Callback error:', error);
    res.redirect(`${process.env.CLIENT_URL}/login?error=auth_failed`);
  }
});

// Get auth status
router.get('/status', (req, res) => {
  try {
    const isAuthenticated = !!(req.session?.tokens && req.session?.user);
    res.json({
      authenticated: isAuthenticated,
      user: req.session?.user || null
    });
  } catch (error) {
    console.error('[AUTH] Status check error:', error);
    res.status(500).json({ error: 'Failed to check auth status' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  try {
    req.session.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('[AUTH] Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

module.exports = router;
