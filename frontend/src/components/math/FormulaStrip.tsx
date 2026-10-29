import React from 'react';
import Link from 'next/link';
import { Tex } from '@/components/ui/Tex';
import { Equation } from '@/config/equations';

interface FormulaStripProps {
  title: string;
  eqs: Equation[];
  className?: string;
}

/** A compact amber band showing the equations behind the page it sits on, linking to /math. */
export const FormulaStrip: React.FC<FormulaStripProps> = ({ title, eqs, className = '' }) => (
  <section className={`fs band tex-paper ${className}`} id="math">
    <div className="fs-in">
      <div className="fs-h">
        <div>
          <div className="eyebrow-n"><b>03</b>The math on this page</div>
          <h2>{title}</h2>
        </div>
        <Link href="/math" className="fs-link">
          All equations <span>→</span>
        </Link>
      </div>

      <div className="fs-grid">
        {eqs.map((eq) => (
          <article key={eq.id} className={`eq tex ${eq.wide ? 'wide' : ''}`}>
            <header>
              <b>{eq.title}</b>
              <i>({eq.id})</i>
            </header>
            <div className="math-formula">
              <Tex block>{eq.tex}</Tex>
            </div>
            <p>{eq.note}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
