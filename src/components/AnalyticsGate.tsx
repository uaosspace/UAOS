import React from 'react'
import {Analytics} from '@vercel/analytics/react'
import {analyticsAllowed, type CookieConsentValue} from '../lib/cookieConsent'

interface AnalyticsGateProps {
  consent: CookieConsentValue
}

/**
 * Loads Vercel Analytics only after explicit cookie consent ("accepted").
 * Enable Web Analytics in the Vercel project dashboard when you want data.
 */
export default function AnalyticsGate({consent}: AnalyticsGateProps) {
  if (!analyticsAllowed(consent)) return null
  return <Analytics />
}
