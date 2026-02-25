🏟 Court Booking App – Expo + Firebase PRD (MVP)

1. Product Summary

A mobile app where users can:

Search and browse sports courts (futsal, badminton)

Check real-time availability

Book and pay for slots

Receive digital receipts

Court admins get:

Dashboard to manage bookings and courts

Revenue overview

Issuing receipts

Tech Stack:

Frontend: Expo (React Native)

Backend / Database: Firebase (Firestore + Auth + Storage)

Payments: Stripe or local mobile wallet integration

Hosting / Notifications: Firebase Hosting & FCM

2. User Roles
   1️⃣ Player (End User)

Search courts

View availability

Book & pay

View booking history

Receive receipt

2️⃣ Court Admin (Venue Owner)

Login / manage courts

View bookings

Confirm & track payments

Revenue overview

Download receipts

3. MVP Scope

Sports: Futsal + Badminton

Mobile-only

Full upfront payment only

No reviews / ratings / chat

Single time slot per booking

Multi-location support optional (for future scalability)

4. Player Flow

Landing / Home Screen

Search courts by location & sport

Court Detail Screen

Images

Price

Availability

Select date & slot

Checkout

Payment

Booking confirmation & receipt

Booking History screen

5. Admin Flow

Admin login

Dashboard overview

Today’s bookings

Upcoming bookings

Revenue summary

Add/Edit court

Time slot management

Booking details view

Download receipt

6. Core Functional Requirements
   Booking & Slot Logic

Prevent double booking (Firestore transaction + slot lock)

Slots updated in near real-time

Confirmation only after successful payment

Payments

Stripe integration (or local gateway)

Full payment upfront

Booking ID + receipt generation

Receipts

Downloadable (PDF) or shareable

Include:

Booking ID

Court name

Date & Time

Amount paid

Payment method

Player name

7. Firebase Architecture (Lean MVP)
   Firestore Collections:

Users

{
"userId": "uid",
"name": "string",
"email": "string",
"role": "player/admin"
}

Courts

{
"courtId": "string",
"name": "string",
"sport": "futsal/badminton",
"location": "string",
"pricePerHour": 25,
"openTime": "08:00",
"closeTime": "22:00",
"images": ["url1", "url2"]
}

Slots

{
"slotId": "string",
"courtId": "string",
"date": "YYYY-MM-DD",
"time": "HH:MM",
"isBooked": false
}

Bookings

{
"bookingId": "string",
"slotId": "string",
"userId": "string",
"courtId": "string",
"date": "YYYY-MM-DD",
"time": "HH:MM",
"amountPaid": 25,
"status": "confirmed/failed",
"paymentId": "string"
}

Receipts

{
"receiptId": "string",
"bookingId": "string",
"generatedAt": "timestamp"
} 8. Key Screens for Expo
Player

Home / Search

Court Detail

Availability Calendar + Slot Selection

Checkout / Payment

Booking Confirmation + Receipt

Booking History

Admin

Admin Login

Dashboard

Add/Edit Court

Slot Management

Booking Table

Revenue Summary

Download Receipt

9. Non-Functional Requirements

Real-time updates (Firestore listeners)

Offline handling: basic caching for search

Authentication (Firebase Auth)

Role-based access control

Push notifications (booking confirmation, slot changes)

Mobile-first responsive UI

10. Metrics for Validation
    bookings per week

Conversion rate (search → payment)

Admin engagement rate

Payment success/failure rate

User retention (returning players)

11. Stretch Features (After MVP)

Multi-sport support

Team/friend invitations for bookings

Waitlist for fully booked slots

Reviews & ratings

Loyalty / discounts / promo codes
