# Student Enrollment Form

A lightweight, responsive web application for managing academic student enrollment records, developed as a micro-project for the **Login2Xplore JsonPowerDB (JPDB)** training course. The project demonstrates direct frontend-to-database interaction using JsonPowerDB REST APIs without requiring a custom backend server.

---

## Table of Contents

- [1. Project Title](#1-project-title)
- [2. Project Description](#2-project-description)
- [3. Objectives](#3-objectives)
- [4. Technologies Used](#4-technologies-used)
- [5. Benefits of Using JsonPowerDB](#5-benefits-of-using-jsonpowerdb)
- [6. Database Structure](#6-database-structure)
- [7. Features and Scope of Functionalities](#7-features-and-scope-of-functionalities)
- [8. Application Workflow](#8-application-workflow)
- [9. Project Setup and Installation](#9-project-setup-and-installation)
- [10. JSONPowerDB Configuration](#10-jsonpowerdb-configuration)
- [11. How to Run the Project](#11-how-to-run-the-project)
- [12. Examples of Use](#12-examples-of-use)
- [13. Screenshots](#13-screenshots)
- [14. Project Status](#14-project-status)
- [15. Release History](#15-release-history)
- [16. Sources and References](#16-sources-and-references)

---

## 1. Project Title

**Student Enrollment Form – Login2Xplore JsonPowerDB Course Micro-Project**

---

## 2. Project Description

The **Student Enrollment Form** is a single-page web application designed to capture, search, create, update, and manage student admission details. It connects directly from the browser client to **JsonPowerDB (JPDB)** via documented REST endpoints.

By utilizing Login2Xplore's `jpdb-commons.js` library, the application performs real-time primary key lookups (`GET_BY_KEY`), record insertions (`PUT`), and in-place record updates (`UPDATE`) against the `SCHOOL-DB` database and `STUDENT-TABLE` relation.

---

## 3. Objectives

* Build a functional, standards-compliant CRUD frontend form using HTML5, CSS3, JavaScript, and jQuery.
* Interface directly with JsonPowerDB without building an intermediate server-side runtime (e.g., Node.js, Express, or Python).
* Implement a strict form state machine enforcing validation, auto-lookup on primary key entry, and dynamic control state transitions.
* Follow secure repository practices by separating local connection tokens (`config.js`) from version-controlled source files.
* Provide an intuitive, responsive academic interface with immediate user feedback for all database interactions.

---

## 4. Technologies Used

| Technology | Purpose | Reference |
| :--- | :--- | :--- |
| **HTML5** | Semantic structure, input types (`text`, `date`), and accessible form controls | [HTML Living Standard](https://html.spec.whatwg.org/) |
| **CSS3** | Responsive two-column desktop / single-column mobile layout, elevation, disabled states | [W3C CSS](https://www.w3.org/Style/CSS/) |
| **JavaScript (ES6+)** | Form controller logic, state management, event listeners, payload formatting | [ECMAScript Specs](https://tc39.es/) |
| **jQuery (v3.6.4)** | DOM selection, synchronous/asynchronous AJAX execution wrapper | [jQuery CDN](https://releases.jquery.com/) |
| **jpdb-commons.js (v0.0.4)** | Official Login2Xplore helper library for constructing JPDB request payloads | [Login2Xplore Resources](https://login2explore.com/jpdb/resources/js/0.0.4/jpdb-commons.js) |
| **JsonPowerDB** | Real-time, schema-free database server on port 5577 | [Login2Xplore JPDB](https://login2explore.com/) |

---

## 5. Benefits of Using JsonPowerDB

JsonPowerDB offers practical architectural advantages for small projects and micro-project assignments:

1. **Native JSON Document Model**: Data is handled as native JSON objects. Developers avoid writing complex SQL queries or Object-Relational Mapping (ORM) boilerplate.
2. **Direct REST API Access**: Built-in HTTP/HTTPS endpoints (`/api/irl` for retrieval and `/api/iml` for manipulation) enable direct browser-to-database communication.
3. **No Custom Backend Required**: Eliminates the overhead of creating, hosting, and maintaining server-side code (e.g., Express.js, Django, or Spring Boot) for basic CRUD tasks.
4. **Schema-Free Flexibility**: Adding or adjusting fields does not require running database migrations or altering fixed table schemas.
5. **Fast Prototyping**: Standard CRUD operations can be implemented quickly using lightweight helper functions (`createPUTRequest`, `createGET_BY_KEYRequest`, `createUPDATERecordRequest`).

---

## 6. Database Structure

The project stores all enrollment data in a designated database and relation within JsonPowerDB:

* **Database Name**: `SCHOOL-DB`
* **Relation Name**: `STUDENT-TABLE`
* **Primary Key / Index Column**: `Roll-No`
* **API Base URL**: `https://api.login2explore.com:5577`
* **Integrated Retrieval Language (IRL) Endpoint**: `/api/irl`
* **Integrated Manipulation Language (IML) Endpoint**: `/api/iml`

### Field Definitions

| Column Name | Data Type | Key Type | Description |
| :--- | :---: | :---: | :--- |
| `Roll-No` | String / Number | **Primary Key** | Unique student identifier; triggers automated database lookup |
| `Full-Name` | String | Regular | Student's full legal name |
| `Class` | String | Regular | Academic class, grade, or division (e.g., `10th-A`, `CS-1`) |
| `Birth-Date` | Date (`YYYY-MM-DD`) | Regular | Student date of birth |
| `Address` | String | Regular | Residential contact address |
| `Enrollment-Date` | Date (`YYYY-MM-DD`) | Regular | Official date of admission |

---

## 7. Features and Scope of Functionalities

* **Automated Primary Key Lookup**: Typing a `Roll-No` and pressing <kbd>Enter</kbd> or <kbd>Tab</kbd> automatically queries the database using `GET_BY_KEY`.
* **State Machine Form Control**: Input fields and action buttons dynamically enable or disable depending on whether the record exists or is new.
* **Duplicate Query Prevention**: An internal lock flag prevents redundant or overlapping network requests while a lookup is executing.
* **Client-Side Validation**: Ensures all six fields are populated before dispatching insert or update requests.
* **Non-Destructive Primary Key Updates**: When updating an existing student, `Roll-No` remains immutable, updating only the remaining five attributes.
* **Prevent Double Submissions**: Action buttons are disabled immediately upon clicking to avoid accidental duplicate submissions.
* **Responsive Academic Interface**: Clean two-column desktop grid collapsing into a single-column layout on mobile devices.
* **Contextual Notification Banner**: Displays immediate, color-coded status messages (Info, Success, Warning, Error) reflecting the real database outcome.

---

## 8. Application Workflow

The application implements strict state transitions dictated by the micro-project specifications:

```
+-------------------------------------------------------------+
|                        INITIAL STATE                        |
| - Roll-No: ENABLED & FOCUSED                                |
| - All other fields: DISABLED                                |
| - Save / Update / Reset: DISABLED                           |
+-------------------------------------------------------------+
                               |
                   User enters Roll-No & triggers
                               |
                  [GET_BY_KEY Lookup via /api/irl]
                               |
              +----------------+----------------+
              |                                 |
      [Record Exists]                   [Record Not Found]
              |                                 |
+-----------------------------+   +-----------------------------+
|       RECORD FOUND          |   |       RECORD NOT FOUND      |
| - Populate all form fields  |   | - Roll-No: ENABLED          |
| - Roll-No: DISABLED         |   | - Remaining fields: ENABLED |
| - Remaining fields: ENABLED |   | - Save & Reset: ENABLED     |
| - Update & Reset: ENABLED   |   | - Update: DISABLED          |
| - Save: DISABLED            |   | - Focus: Full-Name          |
| - Focus: Full-Name          |   +-----------------------------+
+-----------------------------+                 |
              |                           Click "Save"
        Click "Update"                          |
              |                     [PUT via /api/iml]
     [UPDATE via /api/iml]                      |
              |                           On 200 Success
        On 200 Success                          |
              +----------------+----------------+
                               |
                         [Form Reset]
                               |
                    (Return to Initial State)
```

### Workflow State Matrix

| Form State / Event | `Roll-No` | Other Fields | Save | Update | Reset | Focus Field |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Initial State** | **Enabled** | Disabled | Disabled | Disabled | Disabled | `Roll-No` |
| **Lookup: Existing Record** | Disabled | **Enabled** | Disabled | **Enabled** | **Enabled** | `Full-Name` |
| **Lookup: New Record** | **Enabled** | **Enabled** | **Enabled** | Disabled | **Enabled** | `Full-Name` |
| **Save Success** | **Enabled** | Disabled | Disabled | Disabled | Disabled | `Roll-No` |
| **Update Success** | **Enabled** | Disabled | Disabled | Disabled | Disabled | `Roll-No` |
| **Reset Clicked** | **Enabled** | Disabled | Disabled | Disabled | Disabled | `Roll-No` |

---

## 9. Project Setup and Installation

### Prerequisites

* Any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave).
* An active [Login2Xplore](http://login2explore.com/) account and a valid JsonPowerDB Connection Token.
* (Optional) Python 3 or Node.js to run a lightweight local static HTTP server.

### Repository Files

```text
student-enrollment/
├── .gitignore          # Excludes config.js, temporary, and environment files
├── index.html          # Semantic HTML5 markup and CDN dependencies
├── style.css           # Academic layout styling and responsive grid
├── script.js           # JPDB state machine and REST API controller
├── config.example.js   # Template file for local credential setup
├── config.js           # Local credentials file (ignored by Git)
└── README.md           # Project documentation
```

### Installation Steps

1. Clone or download the repository to your local machine:
   ```bash
   git clone https://github.com/Ani1801/jsonpowerdb-student-enrollment.git
   cd jsonpowerdb-student-enrollment
   ```
2. Set up your local configuration file (see Section 10).

---

## 10. JSONPowerDB Configuration

To protect your personal connection token from accidental exposure on public GitHub repositories, credentials are kept in a separate, ignored configuration file:

1. Copy the example configuration template:
   ```bash
   cp config.example.js config.js
   ```
   *(On Windows Command Prompt: `copy config.example.js config.js`)*

2. Open `config.js` and paste your authentic JPDB Connection Token:
   ```javascript
   window.JPDB_CONFIG = {
       connectionToken: "YOUR_ACTUAL_JPDB_TOKEN"
   };
   ```

3. Save `config.js`. Notice that `.gitignore` prevents `config.js` from being committed to Git.

> [!IMPORTANT]
> **Client-Side Security Notice**: Because this project uses direct browser-to-database requests without a backend server, the connection token is loaded into the browser memory at runtime and transmitted in HTTP request payloads. This setup is standard for frontend educational micro-projects, but it is **not** a substitute for server-side secret management in production systems.

---

## 11. How to Run the Project

Due to browser Cross-Origin Resource Sharing (CORS) security policies, opening HTML files directly from disk via `file:///` blocks requests to remote HTTP/HTTPS APIs. The application must be served over an HTTP local server.

### Option A: Using Python (Recommended)

Run in the project directory:
```bash
python -m http.server 8000
```
Open your browser and navigate to:
```text
http://localhost:8000
```

### Option B: Using VS Code Live Server

1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension (`ritwickdey.LiveServer`).
3. Right-click `index.html` &rarr; click **"Open with Live Server"**.
4. The browser opens automatically at `http://127.0.0.1:5500`.

### Option C: Using Node.js `serve`

```bash
npx serve -l 8000
```
Then visit `http://localhost:8000`.

---

## 12. Examples of Use

### Scenario A: Enrolling a New Student

1. Open the application at `http://localhost:8000`.
2. In the **Roll-No** field, type `101` and press <kbd>Enter</kbd> (or <kbd>Tab</kbd>).
3. The application queries `SCHOOL-DB` via `/api/irl`. The status banner displays:
   > *"Roll-No: "101" is available. Please fill all fields and click Save to enroll."*
4. All remaining fields unlock, and focus shifts to **Full-Name**.
5. Enter student information:
   * **Full-Name**: `Aditi Sharma`
   * **Class**: `10th-A`
   * **Birth-Date**: `2008-05-14`
   * **Address**: `Flat 402, Green Valley Apartments, Pune`
   * **Enrollment-Date**: `2026-06-01`
6. Click **Save**.
7. The record is inserted via JPDB `/api/iml`. A confirmation alert appears:
   > *"Success: Student with Roll-No 101 enrolled successfully!"*
8. The form resets to its pristine initial state, ready for the next entry.

### Scenario B: Updating an Existing Student

1. In the **Roll-No** field, enter `101` and press <kbd>Enter</kbd>.
2. The database returns `status 200`. The form automatically populates all fields with Aditi's saved information.
3. The **Roll-No** field is disabled to preserve the primary key.
4. The **Update** and **Reset** buttons become enabled; **Save** is disabled.
5. Modify the **Class** to `11th-Science` and the **Address** to `B-12, Model Colony, Pune`.
6. Click **Update**.
7. The update request executes against JPDB `/api/iml` using the internal `rec_no`.
8. Upon confirmation, the form alerts success and resets to the initial state.

### Scenario C: Resetting the Form

* Click **Reset** at any time to discard unsaved changes, clear all fields, restore button disabled states, and refocus on **Roll-No**.

---

## 13. Screenshots

*Screenshots can be placed in an `assets/` or `screenshots/` directory for visual showcase.*

### Adding Screenshots to this Repository:
1. Create a folder named `screenshots/` in the project root.
2. Capture images of:
   * `01-initial-state.png`: Initial loaded form with only Roll-No active.
   * `02-new-student.png`: Unlocked form ready for new enrollment after a lookup.
   * `03-record-found.png`: Populated fields and active Update button for an existing record.
3. Link them in Markdown:
   ```markdown
   ![Initial State](screenshots/01-initial-state.png)
   ![Record Found](screenshots/02-record-found.png)
   ```

---

## 14. Project Status

* **Status**: Complete & Production-Ready (Educational Micro-Project)
* **Tested Operations**:
  * `GET_BY_KEY` lookup via `/api/irl` (Confirmed)
  * `PUT` insertion via `/api/iml` (Confirmed)
  * `UPDATE` record modification via `/api/iml` (Confirmed)
  * In-memory record tracking without `localStorage` or mock API substitutes (Confirmed)
  * Local token isolation via `config.js` and `.gitignore` (Confirmed)

---

## 15. Release History

* **v1.0.0** – *November 16, 2026*
  * Initial public release for Login2Xplore course micro-project submission.
  * Implemented complete CRUD workflow for `SCHOOL-DB` / `STUDENT-TABLE`.
  * Added responsive academic UI with CSS grid and state transition logic.
  * Added `config.js` credential isolation with `config.example.js` template.
  * Updated connection endpoints to secure HTTPS (`https://api.login2explore.com:5577`).

---

## 16. Sources and References

1. **JsonPowerDB Official Documentation**: [login2explore.com/jpdb/docs.html](https://login2explore.com/jpdb/docs.html)
2. **JsonPowerDB Developer Dashboard**: [login2explore.com](https://login2explore.com/)
3. **JPDB Commons JavaScript Library (v0.0.4)**: [login2explore.com/jpdb/resources/js/0.0.4/jpdb-commons.js](https://login2explore.com/jpdb/resources/js/0.0.4/jpdb-commons.js)
4. **jQuery API Documentation**: [api.jquery.com](https://api.jquery.com/)
5. **MDN Web Docs – Working with Object Data & REST APIs**: [developer.mozilla.org](https://developer.mozilla.org/)
