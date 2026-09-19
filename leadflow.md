## intro
AI Customer Acquisition Systems
"An AI-powered lead capture and follow-up system that helps Kenyan SMEs convert WhatsApp inquiries into paying customers."

## choosen market
Real Estate Agencies

## core business problem
Problem Statement

Kenyan real estate agencies receive property inquiries through WhatsApp, Facebook, websites, and phone calls every day. Many of these inquiries are not responded to immediately because agents are busy with viewings, negotiations, documentation, or other clients.

This delay causes qualified prospects to lose interest or contact competing agencies.

As a result, agencies lose potential commissions, waste marketing spend, and struggle to consistently convert inquiries into property viewings and completed transactions.

Current lead management is often manual, inconsistent, and dependent on individual agents remembering to follow up.

The opportunity is to create an AI-powered lead capture and follow-up system that engages prospects instantly, qualifies them automatically, organizes lead information, and ensures agents focus on the highest-value opportunities.

## define problem
Agency receives:100 inquiries/month 
Agent responds late to:40 inquiries
Potential loss:40% of opportunities

## core business solution
LeadFlow AI helps real estate agencies convert more inquiries into property viewings by instantly responding to prospects, qualifying leads automatically, collecting key buyer information, and ensuring no serious prospect is forgotten.

## define solution 
Customer:Hi, is the apartment in Ruaka available?
System:Instant AI Response
Example:Hello! Yes, we have apartments available in Ruaka.
        May I know:1. Your budget range?
                   2. Number of bedrooms?
                   3. Preferred move-in date?
AI continues gathering information.(budget,bedrooms,location,move date,phone number)

## lead scoring example
Customer says:
Budget: 50,000

Move Date:
Next Week

Bedrooms:
2

System calculates:
Budget Match +20

Move Soon +25

Complete Profile +20

Phone Provided +20

Total = 85

result: HOT LEAD

## Agent Receives Notification
Agent gets:
New Hot Lead

Name: John

Budget: KES 50,000

Move Date:
Next Week

Score: 85 
Agent immediately calls

## Offline-First Design
problem:Agent visits a property.Network disappears. Most cloudCRMsstopworking.

Our Solution:Build Progressive Web App

## offline-first features
Install on Phone
Works Like App
Offline Cache
Sync Later

Agent can:Open Dashboard, View Existing Leads, Update Notes,Change Status even when offline

## offline AI
Fallback Rules Engine.EXAMPLE;Keyword Detection Bedrooms Budget Location Simple logic continues collecting information. example(budget) What budget range are you considering?
1. Below 30k
2. 30k-60k
3. 60k-100k
4. Above 100k still useful 

## SMS integration(offline)
customer sends SMS: HOUSE
system replies: Location? Budget? Bedrooms?
This can be integrated later using: SMS gateways

## Technology
frontend: React
offline layer: Service Workers, IndexedDB
Libraries:Workbox, Dexie.js

## mobile first UI
priorities Lead List, Search, Filters, Status Updates

## The Complete System Architecture
Customer

↓

WhatsApp/SMS

↓

LeadFlow AI

↓

AI Qualification

↓

Lead Scoring

↓

MongoDB

↓

Dashboard

↓

Agent

↓

Property Viewing

↓

Deal Closed
