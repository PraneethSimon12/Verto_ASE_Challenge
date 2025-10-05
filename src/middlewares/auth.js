export function requireApiKey(req, res, next) {
  const configured = process.env.API_KEY || 'dev-secret-key'; // change in prod
  const provided = req.headers['x-api-key'];

  if (!provided || provided !== configured) {
    return res.status(401).json({ error: 'Unauthorized (missing or invalid x-api-key)' });
  }
  next();
}
