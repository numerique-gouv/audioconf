module.exports.shouldRedirectToLocation = (res, location) => {
  // Escape slashes for regex
  const escapedLocation = location.replace('/', '\/')
  res.should.redirectTo(new RegExp(`^http:\/\/127.0.0.1:[0-9]+${escapedLocation}$`))
}
