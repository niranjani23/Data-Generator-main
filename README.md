# AI Dummy Data Generator

An intelligent web application that generates customizable dummy data for development and testing purposes using Google's Gemini AI.

## 🚀 Features

*   **Natural Language Prompts**: Describe the data you need in plain English (e.g., "50 e-commerce products with name, price, and category").
*   **Complex Data Support**: Effortlessly generate deep nested JSON structures, arrays within objects, and relational data.
*   **Advanced Formatting Controls**: Customize specific output formats, including Date styling (ISO 8601, Unix Timestamp, Custom) and Decimal Precision for numeric values.
*   **Quick Start Templates**: Clickable example prompts (User Profiles, E-commerce, etc.) to help you get started immediately.
*   **Strict Typing**: Specific support for data types like Booleans, Enums, Floats, and Dates.
*   **Multiple Formats**: Support for JSON, CSV, XML, and TXT outputs.
*   **Real-time Streaming**: Watch the data being generated in real-time.
*   **One-Click Download**: Easily download the generated data as a file.
*   **Copy to Clipboard**: Quick copy functionality for immediate use.

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript
*   **Styling**: Tailwind CSS
*   **AI Integration**: Google GenAI SDK (`@google/genai`)
*   **Model**: Gemini 3 Flash Preview (`gemini-3-flash-preview`)

## 📋 How to Use

1.  **Enter Description**: Type a description of the data you need in the text area, or click one of the "Quick Examples" buttons to pre-fill a scenario.
2.  **Configure Output**: 
    *   Select your desired file format (JSON, CSV, XML, or TXT).
    *   Choose a specific **Date Format** (e.g., YYYY-MM-DD or Unix Timestamp).
    *   Set **Decimal Precision** for floating-point numbers.
3.  **Generate**: Click the "Generate Data" button.
4.  **Use Data**: Once generation is complete, you can copy the raw text or download it as a file with the correct extension.

## 🔑 Configuration

The application requires a Google Gemini API key to function. This is handled via the `API_KEY` environment variable.

## 📝 Example Prompts

*   "List of 10 fictional employees with first name, last name, job title, and salary between $50k and $100k"
*   "5 blog posts with title, slug, summary, and publish date in 2024"
*   "20 users with a nested 'address' object (city, state, zip), a boolean 'isActive' flag, and a role Enum (Admin, Editor, User)"
*   "A configuration object for a dark mode theme with hex codes"

---

Powered by [Google Gemini](https://ai.google.dev/)