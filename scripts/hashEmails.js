// SCRIPT TO RUN IF WE WANT TO HASH EMAILS FOR OLD ROWS GLOBALLY

// script to run manually the job.
const computeHashedEmail = require("../jobs/hashEmails")

computeHashedEmail()
