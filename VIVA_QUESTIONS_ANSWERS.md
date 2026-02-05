# NEXORA FRAUD PREDICTOR - VIVA Q&A

---

## Q1: How does the Crowd Intelligence scoring algorithm work?

Each fraud report from the last 30 days adds +1 point. Phishing and Identity Theft categories add +2 bonus points. Score 0 = Safe (Green), 1-5 = Suspicious (Yellow), >5 = High Risk (Red).

---

## Q2: Why did you choose MongoDB over SQL databases?

MongoDB offers flexible schema for varied fraud data, document-based storage that matches JavaScript objects naturally, excellent performance with indexing, and horizontal scalability for future growth.

---

## Q3: How is user authentication handled securely?

We use JWT tokens with 7-day expiry, bcrypt password hashing, token blacklisting on logout, strong password requirements (8+ chars with uppercase, lowercase, number, special char), and rate limiting on login attempts.

---

## Q4: What happens if a user submits a false fraud report?

Reports have status fields (pending/verified/rejected). Admins can mark reports as inactive which excludes them from scoring. All submissions are logged with user ID and IP address for accountability.

---

## Q5: How do you prevent spam or malicious mass reporting?

Rate limiting (100 requests/15min), mandatory JWT authentication, KYC phone verification before reporting, input validation on all fields, and activity logging with IP tracking.

---

## Q6: What are the three risk levels and their thresholds?

SAFE (0 points, Green) - No reports found. SUSPICIOUS (1-5 points, Yellow) - Proceed with caution. HIGH RISK (>5 points, Red) - Multiple fraud reports, avoid transaction.

---

## Q7: How does the KYC/OTP verification work?

User enters phone number, system sends 6-digit OTP via email, OTP expires in 5 minutes, user verifies OTP, system marks user as KYC verified enabling fraud reporting access.

---

## Q8: What security measures are implemented?

Helmet for HTTP headers, rate limiting against DDoS, mongo-sanitize against NoSQL injection, XSS protection, CORS configuration, JWT blacklisting, bcrypt password hashing, and express-validator for input validation.

---

## Q9: Can a reported entity be cleared or marked safe? How?

Yes. Users can add entities to personal safe-list or block-list. Admins can reject reports or mark them inactive. Personal lists don't affect global scoring but inform user's dashboard.

---

## Q10: What is the average API response time?

Under 200ms. Achieved through MongoDB indexing on targetEntity and timestamp, efficient 30-day window queries, and lightweight scoring algorithm without complex ML.

---

## Q11: How do you handle real-time updates in the dashboard?

Socket.io on backend and frontend enables live WebSocket connections. New fraud reports trigger instant notifications to connected users without page refresh.

---

## Q12: What are the four entity types supported?

Phone (telecom fraud), Email (phishing), UPI (payment fraud), and Bank Account (financial fraud).

---

## Q13: How did you seed/populate the fraud database?

Using seed-comprehensive-fraud-data.js script that generates 27,702+ synthetic reports with realistic Indian phone numbers, emails, UPI IDs across 10 fraud categories spread over 30 days.

---

## Q14: What is the role of activity logging in this system?

ActivityLog tracks who did what, when, and from where - including action type, user ID, target entity, timestamp, IP address, and user agent for audit trail and abuse detection.

---

## Q15: How scalable is this architecture for millions of reports?

MongoDB supports sharding, indexed queries ensure fast lookups, stateless JWT allows load balancing, 30-day window limits query scope, Node.js handles concurrent requests efficiently.

---

*Document prepared for Nexora Fraud Predictor project viva/presentation*
