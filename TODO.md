# TODO

[X] - Create a Next.js 15 project
[X] - Set up Tailwind CSS and shadcn/ui
[] - Implement file upload UI for diagrams
[] - Integrate OpenAI Vision API to analyze diagrams
[] - Generate explanation text from diagram
[] - Convert explanation text to audio (TTS)
[] - Build UI to display text + play audio simultaneously
[] - Add microphone input for user queries
[] - Integrate Whisper API for Speech-to-Text
[] - Set up Vercel AI SDK for conversational streaming
[] - Implement AI conversation loop (text + voice output)
[] - Maintain diagram context across conversation
[] - Deploy to Vercel

## User Flow

- User opens the app and sees an option to upload an image or use microphone input.
- User uploads an image.
- Frontend sends the image to backend API.
- Backend calls OpenAI Vision model to analyze the image.
- Backend returns a text explanation to the frontend.
- Frontend displays the explanation and sends it to TTS API.
- TTS API generates audio.
- Frontend plays the audio for the user.

## Conversation Flow

- User speaks using microphone.
- Frontend records audio and sends it to backend API.
- Backend calls Whisper API to transcribe speech.
- Transcript + previous context is sent to OpenAI Chat API.
- Chat API generates a response.
- Response is returned to frontend.
- Frontend displays the response and sends it to TTS API.
- TTS API generates audio.
- Frontend plays the audio.
- Loop continues for further interaction.

## Tech Stack

- Next.js 15 (App Router)
- Next.js server actions (or API routes)
- Tailwind CSS + shadcn/ui (UI components)
- Vercel AI SDK (for streaming AI responses)
- Browser Speech API (for microphone input)
- OpenAI GPT-4o (Vision for diagram understanding, Text + Speech for conversation)
- OpenAI Speech-to-Text (Whisper API) for user voice input
- OpenAI Text-to-Speech (TTS) for AI voice responses
- Uploadthing for handling file uploads
- Vercel for deployment
- Optional - (Convex / Upstash Redis) for storing diagrams, conversation history & caching persistence
