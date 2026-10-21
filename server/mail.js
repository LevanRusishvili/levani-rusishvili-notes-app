// In development no real email is sent: the message is printed in this terminal.
// In production, replace the body of this function with a real mail provider
// (e.g. nodemailer + SMTP, SendGrid, Resend). Nothing else in the app has to change.
function sendPasswordResetEmail(email, link) {
  console.log(
    "\n================ PASSWORD RESET (dev, no real email) ================",
  );
  console.log(`To:   ${email}`);
  console.log(`Link: ${link}`);
  console.log("The link works once and expires in 1 hour.");
  console.log(
    "=====================================================================\n",
  );
}

module.exports = { sendPasswordResetEmail };
