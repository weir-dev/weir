'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderBarProps {
  phaseText?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({ phaseText = 'phase 1 · learning' }) => {
  const pathname = usePathname();
  const navLinks = [
    { name: 'Hero', href: '/' },
    { name: 'Window', href: '/window' },
    { name: 'Ladder', href: '/ladder' },
    { name: 'The Math', href: '/math' },
    { name: 'Runs', href: '/runs' },
    { name: 'About', href: '/about' },
    { name: '$WEIR', href: '/token' },
  ];

  return (
    <header className="top glass-panel">
      {/* Left Column: Wordmark Box & Subtitle */}
      <div className="top-left">
        <Link 
          href="/" 
          className="wordmark"
          aria-label="WEIR home"
        >
          <span className="logo-box" aria-hidden="true">
            <img 
              src="/brand/weir-logo.webp" 
              alt="WEIR Logo" 
              width={72}
              height={72}
            />
          </span>
          <span style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="wm-name">WEIR</span>
            <span className="wm-net">Solana Mainnet</span>
          </span>
        </Link>
        <p className="sub">
          WEIR has been at this window since day one, counting every Solana token that clears $10K. The gate only opens when the evidence is <em>provably</em> good enough.
        </p>
      </div>

      {/* Center Navigation Tabs */}
      <nav className="nav" aria-label="Main">
        {navLinks.map((link) => {
          const isActive = (pathname === link.href) || (link.href === '/' && pathname === '');
          return (
            <Link
              key={link.name}
              href={link.href}
              className={isActive ? 'active' : ''}
              aria-current={isActive ? 'page' : undefined}
            >
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Right Column: X Link */}
      <div className="topright">
        <a
          href="https://x.com/weircount"
          target="_blank"
          rel="noopener noreferrer"
          className="xbtn"
          aria-label="Follow WEIR on X"
          title="Follow WEIR on X (@weircount)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>
      </div>

      {/* Page info */}
      <div className="pageinfo">
        <span className="sym">$WEIR</span>
        <span className="sep" aria-hidden="true" />
        <span className="phase">{phaseText}</span>
      </div>
    </header>
  );
};

export const SiteHeader = HeaderBar;

