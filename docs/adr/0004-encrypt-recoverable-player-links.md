# Encrypt recoverable Player Links

Arena will let a Creator recover both Player Links from the Match Link while a Match remains incomplete and unexpired. Each Player capability is therefore stored twice: a one-way hash for request lookup and a reversibly encrypted copy for authorized display; the ciphertext is removed when the Match becomes Completed or Expired, while the hash keeps a Completed Player Link available for final read-only state and lets an Expired link be rejected uniformly.
