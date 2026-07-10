// Shared guard for admin-only API routes. The admin UI sends the password
// back on every request via the x-admin-password header; routes must check
// this before touching the database with the service-role client.
export function isAuthorized(req) {
  const supplied = req.headers.get('x-admin-password')
  return !!process.env.ADMIN_PASSWORD && supplied === process.env.ADMIN_PASSWORD
}
