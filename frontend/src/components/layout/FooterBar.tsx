'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { WEIR_CONTRACT_ADDRESS } from '@/config/constants';

export const FooterBar: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const ca = WEIR_CONTRACT_ADDRESS || '';

  const handleCopy = async () => {
    if (!ca) return;
    try {
      await navigator.clipboard.writeText(ca);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = ca;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      <div className="wave-rule" aria-hidden="true"></div>
      <footer className="foot2" id="about">
        <div className="row1">
          <div className="brand2">
            <span className="mk" aria-hidden="true">
              <img src="/brand/weir-logo.webp" alt="" width={56} height={56} />
            </span>
            <div>
              <b>WEIR</b>
              <span>Few clear the falls. We count every one.</span>
            </div>
          </div>
          <nav className="links" aria-label="Footer">
            <Link href="/window">Window</Link>
            <Link href="/ladder">Ladder</Link>
            <Link href="/math">The Math</Link>
            <Link href="/runs">Runs</Link>
            <Link href="/about">About</Link>
            <Link href="/token">$WEIR</Link>
          </nav>
        </div>
        <div className="row2">
          <span>Live mainnet data · WEIR is a research platform, not a financial adviser. Four features cannot forecast a market. This measures survival, not price.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              onClick={handleCopy}
              type="button"
              className="cabtn"
              title={ca ? "Click to copy CA" : "CA will be revealed upon verified launch"}
            >
              <b>CA</b>
              <span className="ca-full">
                {ca ? (copied ? 'COPIED' : ca) : '[ADDED AT LAUNCH]'}
              </span>
            </button>
            <a
              className="xlink"
              href="https://x.com/weircount"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow WEIR on X"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>@weircount</span>
            </a>
          </span>
        </div>
        <div className="giant" aria-hidden="true">
          <span>WEIR<em>.</em></span>
        </div>
      </footer>
    </>
  );
};

export const SiteFooter = FooterBar;

