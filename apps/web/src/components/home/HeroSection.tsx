'use client'

import Link from 'next/link'

interface HeroStats {
  eventCount: number
  attendeeCount: number
  cityCount: number
}

interface HeroSectionProps {
  stats?: HeroStats
}

export function HeroSection({ stats }: HeroSectionProps) {
  const defaultStats: HeroStats = {
    eventCount: 150,
    attendeeCount: 50000,
    cityCount: 4,
  }

  const displayStats = stats || defaultStats

  return (
    <>
      <style>{`
        .__ct_hero {
          background: linear-gradient(135deg, #7C3AED, #C026D3);
          padding: 48px 24px;
          margin: 0;
          overflow: hidden;
          position: relative;
        }

        .__ct_hero_content {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          gap: 48px;
          position: relative;
          z-index: 1;
        }

        .__ct_hero_left {
          flex: 1;
          min-width: 0;
        }

        .__ct_hero_eyebrow {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: rgba(255, 255, 255, 0.7);
          margin-bottom: 16px;
          display: block;
        }

        .__ct_hero_h1 {
          font-size: 40px;
          font-weight: 800;
          line-height: 1.2;
          color: #ffffff;
          margin: 0 0 16px 0;
          letter-spacing: -0.02em;
        }

        .__ct_hero_subtitle {
          font-size: 16px;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.8);
          margin-bottom: 32px;
          max-width: 520px;
        }

        .__ct_hero_cta {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          background: transparent;
          border: 1.5px solid #ffffff;
          border-radius: var(--radius-md);
          color: #ffffff;
          font-size: 14px;
          font-weight: 600;
          text-decoration: none;
          cursor: pointer;
          transition: all var(--duration-fast) ease;
          outline: none;
        }

        .__ct_hero_cta:hover {
          background: #ffffff;
          color: #7C3AED;
          transform: translateY(-2px);
        }

        .__ct_hero_cta:focus-visible {
          outline: 2px solid #ffffff;
          outline-offset: 2px;
        }

        .__ct_hero_arrow {
          display: inline-block;
          font-size: 16px;
          margin-left: 4px;
        }

        .__ct_hero_right {
          flex: 0 0 40%;
          display: none;
        }

        .__ct_hero_stats {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .__ct_hero_stat {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .__ct_hero_stat_value {
          font-size: 24px;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1;
        }

        .__ct_hero_stat_label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
        }

        /* Mobile: single column, stats in horizontal row below CTA */
        @media (max-width: 767px) {
          .__ct_hero {
            padding: 32px 16px;
          }

          .__ct_hero_content {
            flex-direction: column;
            gap: 32px;
          }

          .__ct_hero_h1 {
            font-size: 28px;
          }

          .__ct_hero_subtitle {
            font-size: 14px;
            margin-bottom: 24px;
          }

          .__ct_hero_stats {
            flex-direction: row;
            gap: 32px;
            width: 100%;
          }

          .__ct_hero_stat {
            flex: 1;
          }

          .__ct_hero_stat_value {
            font-size: 20px;
          }

          .__ct_hero_stat_label {
            font-size: 11px;
          }
        }

        /* Desktop: show right stats column */
        @media (min-width: 768px) {
          .__ct_hero_right {
            display: flex;
          }
        }
      `}</style>

      <section className="__ct_hero" aria-label="Hero section">
        <div className="__ct_hero_content">
          {/* Left column: tagline + CTA */}
          <div className="__ct_hero_left">
            <span className="__ct_hero_eyebrow">Nigeria's #1 Event Ticketing Platform</span>
            <h1 className="__ct_hero_h1">Your face is your ticket.™</h1>
            <p className="__ct_hero_subtitle">
              See what's happening tonight in Ilorin
            </p>
            <Link href="/events" className="__ct_hero_cta">
              Explore Events
              <span className="__ct_hero_arrow">→</span>
            </Link>
          </div>

          {/* Right column: desktop stats (hidden on mobile) */}
          <div className="__ct_hero_right">
            <div className="__ct_hero_stats">
              <div className="__ct_hero_stat">
                <div className="__ct_hero_stat_value">{displayStats.eventCount}+</div>
                <div className="__ct_hero_stat_label">Events</div>
              </div>
              <div className="__ct_hero_stat">
                <div className="__ct_hero_stat_value">{displayStats.attendeeCount.toLocaleString()}+</div>
                <div className="__ct_hero_stat_label">Attendees</div>
              </div>
              <div className="__ct_hero_stat">
                <div className="__ct_hero_stat_value">{displayStats.cityCount}</div>
                <div className="__ct_hero_stat_label">Cities</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
