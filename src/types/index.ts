// src/types/index.ts
//
// Shared TypeScript interfaces for Semak Dulu (ScamShield).
// This is the single source of truth for the data contracts used across
// services, hooks, context, and UI. Services never import React; these
// types keep analysis logic testable in isolation.
//
// Requirements: 12.4 (authoritative AnalysisResult schema).

/** UI languages. Bahasa Melayu is the default. Extensible: 'zh' | 'ta'. */
export type Language = 'ms' | 'en';

/** Language detected from an analysed message. */
export type DetectedLanguage = 'bm' | 'en' | 'manglish' | 'mixed';

/** Risk classification for an analysis result. */
export type RiskLevel = 'SAFE' | 'SUSPICIOUS' | 'LIKELY SCAM';

/** Supported Check input modes. */
export type InputMode = 'text' | 'phone' | 'screenshot';

/** A single explainable red flag found in the input. */
export interface RedFlag {
  /** Quoted phrase from the input. */
  phrase: string;
  /** Plain-language explanation of why this is a concern. */
  reason: string;
}

/** A character range in the submitted text to visually highlight. */
export interface Highlight {
  /** Char offset (inclusive) in submitted text. */
  start: number;
  /** Char offset (exclusive) in submitted text. */
  end: number;
  /** Plain-language explanation for this highlight. */
  reason: string;
}

/**
 * The authoritative analysis contract (Requirement 12.4).
 * Both `aiService` and `fallbackAnalyzer` emit this exact shape, so UI code
 * never branches on the source.
 */
export interface AnalysisResult {
  riskLevel: RiskLevel;
  /** Integer 0–100. */
  riskScore: number;
  /** Scam type label; '' when none identified. */
  scamType: string;
  redFlags: RedFlag[];
  highlights: Highlight[];
  /** Ordered, safe actions for the user to take. */
  nextSteps: string[];
  /** Share-ready plain-language summary for family. */
  summaryForFamily: string;
  /** Non-certainty disclaimer text. */
  confidenceNote: string;
  /** Internal provenance; set by our code, never trusted from the model. */
  source: 'ai' | 'fallback';
}

/** A single Scam Simulator question. */
export interface QuizQuestion {
  id: string;
  /** The message to classify. */
  content: string;
  /** Correct answer: true when the message is a scam. */
  isScam: boolean;
  explanation: string;
  redFlags: RedFlag[];
  scamType?: string;
}

/** Quiz progression tiers. */
export type QuizLevel = 'Beginner' | 'Alert' | 'Guardian' | 'Scam Buster';

/** Persisted quiz progress state. */
export interface QuizState {
  score: number;
  streak: number;
  level: QuizLevel;
  /** Ids answered this session. */
  answered: string[];
}

/** A saved family contact for sharing alerts. */
export interface FamilyContact {
  id: string;
  name: string;
  relationship: string;
  /** Optional, used for wa.me; never persisted sensitive data. */
  phone?: string;
}

/** A sample message chip shown on the Check page. */
export interface ScamSample {
  id: string;
  /** Chip label. */
  label: string;
  content: string;
  category: 'scam' | 'legit';
}

/** A call tactic the Call Coach matches against a transcript. */
export interface CallTactic {
  id: string;
  /** e.g. "OTP request". */
  name: string;
  /** BM/EN/Manglish trigger phrases. */
  cues: string[];
  /** Carefully phrased recommended action (Requirement 15.5). */
  recommendedAction: string;
}

/** DEMO-framed data powering the Community Scam Radar. */
export interface RadarData {
  /** Always carries DEMO framing. */
  updatedLabel: string;
  kpis: { label: string; value: string }[];
  weeklyByType: { type: string; count: number }[];
  trend8w: { week: string; count: number }[];
  /** 13 states + 3 federal territories. */
  states: { name: string; isFederalTerritory: boolean; count: number }[];
  trendingNow: { title: string; note: string }[];
}

/** User-provided fields for building a copy-ready report summary. */
export interface ReportInput {
  scamType: string;
  message: string;
  sender: string;
  date: string;
  link: string;
  indicators: string[];
}
