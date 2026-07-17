# UER (UNILAG Emergency Response)

An incident routing system designed to handle campus-wide emergency reporting at UNILAG. It automatically routes crises to medical, fire, or security teams, instantly connecting students to the exact departments they need.

The system utilizes a modern decoupled architecture—pairing a strict TypeScript React client with a robust Spring Boot Java backend—to intelligently process and dispatch emergencies.

## System Architecture

UER is built with a strict separation of concerns, ensuring high scalability, maintainability, and type safety across the entire stack:

* **Frontend (React + TypeScript):** A responsive, mobile-first client providing a seamless user experience. Written in strict TypeScript for robust state management and error reduction under critical conditions.
* **Backend (Java + Spring Boot):** The core routing engine. It exposes RESTful APIs to handle incident state management, department availability, and complex dispatch strategies with minimal boilerplate.
* **Database (PostgreSQL / Supabase):** Fast, reliable data persistence handling concurrent transaction processing and relational integrity.

## Core Features

* **Real-Time Reporting:** Users can instantly log incidents with dynamic severity and location tagging.
* **Intelligent Dispatch Routing:** The Spring Boot service layer utilizes the Strategy Pattern to evaluate incident types and automatically notify the correct department(s).
* **Multi-Unit Coordination:** Capable of dispatching combinations of responders (e.g., Alpha Base + Medical Center) for complex emergencies.
* **Strict State Management:** Enforced lifecycle tracking for every incident (`REPORTED` -> `DISPATCHED` -> `EN_ROUTE` -> `RESOLVED`).

## Getting Started

### Prerequisites
To run this project locally, you will need:
* Java Development Kit (JDK) 17 or higher
* Node.js (v18+) and npm/yarn
* A [Supabase](https://supabase.com/) account
* Git

### Local Environment Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/davidxml/UER
   cd UER
