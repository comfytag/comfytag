/**
 * ComfyTag Face SDK Adapter
 *
 * Single integration point for KBY-AI face recognition.
 * All face operations go through this file.
 *
 * TO ACTIVATE REAL SDK (when license arrives):
 *   1. Install: npx expo install kby-ai-face-recognition
 *      (or the actual package name from KBY-AI docs)
 *   2. Add EXPO_PUBLIC_FACE_SDK_KEY=your_license_key
 *      to apps/mobile/.env
 *   3. Replace the mock implementations below with
 *      real KBY-AI SDK calls — interface stays identical
 *   4. No other files need to change
 */

import { Platform } from 'react-native'

// ─── Types ────────────────────────────────────────────

export interface FaceEnrollmentResult {
  success: boolean
  faceTemplate: string | null
  livenessScore: number  // 0.0 – 1.0
  qualityScore: number   // 0.0 – 1.0
  error?: string
}

export interface FaceVerificationResult {
  match: boolean
  confidence: number    // 0.0 – 1.0
  livenessScore: number // 0.0 – 1.0
  error?: string
}

export interface FaceLivenessResult {
  isLive: boolean
  score: number         // 0.0 – 1.0
  instruction?: string  // e.g. "Blink slowly", "Turn left"
  error?: string
}

export interface FaceSDKStatus {
  initialized: boolean
  licensed: boolean
  platform: string
  sdkVersion: string | null
}

// ─── SDK mode detection ───────────────────────────────

const SDK_KEY = process.env.EXPO_PUBLIC_FACE_SDK_KEY
const IS_REAL_SDK = !!SDK_KEY && SDK_KEY.length > 10

// ─── Mock implementations ─────────────────────────────
// Simulates realistic SDK behaviour for development.
// Enrollment: always succeeds after 2s delay
// Verification: matches if confidence param > 0.7
// Liveness: always passes after 1.5s delay

const mockDelay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms))

const mockEnroll = async (): Promise<FaceEnrollmentResult> => {
  await mockDelay(2000) // Simulates camera processing time
  return {
    success: true,
    faceTemplate: `mock_template_${Date.now()}_${Platform.OS}`,
    livenessScore: 0.97,
    qualityScore: 0.94,
  }
}

const mockVerify = async (
  capturedTemplate: string,
  storedTemplate: string
): Promise<FaceVerificationResult> => {
  await mockDelay(800) // Simulates matching time
  // In mock mode: match if both templates are non-empty
  // In production: KBY-AI computes actual biometric distance
  const match = capturedTemplate.length > 0 &&
                storedTemplate.length > 0
  return {
    match,
    confidence: match ? 0.96 : 0.23,
    livenessScore: 0.98,
  }
}

const mockLiveness = async (): Promise<FaceLivenessResult> => {
  await mockDelay(1500)
  return {
    isLive: true,
    score: 0.98,
    instruction: 'Blink slowly',
  }
}

// ─── Real SDK implementations ─────────────────────────
// TODO: Replace with actual KBY-AI SDK calls when licensed
// KBY-AI React Native docs: https://kby-ai.com/docs/rn
//
// import KBYFaceSDK from 'kby-ai-face-recognition'
//
// const realEnroll = async () => {
//   const result = await KBYFaceSDK.enrollFace({
//     licenseKey: SDK_KEY,
//     livenessCheck: true,
//   })
//   return {
//     success: result.status === 'success',
//     faceTemplate: result.template,
//     livenessScore: result.livenessScore,
//     qualityScore: result.qualityScore,
//   }
// }
//
// etc. — implement when KBY-AI package is available

// ─── Public API ───────────────────────────────────────
// These are the ONLY functions screens should call.
// Never call mock* or real* functions directly.

/**
 * Enroll a new face during onboarding or re-enrollment.
 * Opens the camera, runs liveness check, returns template.
 * The template is sent to the server via POST /face/enroll
 */
export const enrollFace = async (): Promise<FaceEnrollmentResult> => {
  if (IS_REAL_SDK) {
    // Replace with: return realEnroll()
    throw new Error('Real SDK not yet integrated')
  }
  return mockEnroll()
}

/**
 * Verify a captured face against a stored template.
 * Called by organizer check-in screen.
 * Comparison happens on-device — result sent to server.
 */
export const verifyFace = async (
  capturedTemplate: string,
  storedTemplate: string
): Promise<FaceVerificationResult> => {
  if (IS_REAL_SDK) {
    // Replace with: return realVerify(capturedTemplate, storedTemplate)
    throw new Error('Real SDK not yet integrated')
  }
  return mockVerify(capturedTemplate, storedTemplate)
}

/**
 * Run liveness detection only (no enrollment).
 * Used to confirm a real person is present before
 * running face verification at check-in.
 */
export const checkLiveness = async (): Promise<FaceLivenessResult> => {
  if (IS_REAL_SDK) {
    // Replace with: return realLiveness()
    throw new Error('Real SDK not yet integrated')
  }
  return mockLiveness()
}

/**
 * Get current SDK status — used on settings/debug screens
 */
export const getSDKStatus = (): FaceSDKStatus => {
  return {
    initialized: true,
    licensed: IS_REAL_SDK,
    platform: Platform.OS,
    sdkVersion: IS_REAL_SDK ? '1.0.0' : 'mock',
  }
}
