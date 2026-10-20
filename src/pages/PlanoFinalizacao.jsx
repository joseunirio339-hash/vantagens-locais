import React from 'react';
import { FileText, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLAN, generatePlanFinalizacaoPdf } from '@/lib/planFinalizacaoPdf';

export default function PlanoFinalizacao() {
  return (
    <div className="min-h-screen bg-stone-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0">
                <FileText className="w-7 h-7 text-amber-700" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-stone-800 tracking-tight">{PLAN.title}</h1>
                <p className="text-sm text-stone-500 mt-1">{PLAN.subtitle}</p>
              </div>
            </div>
            <Button
              onClick={generatePlanFinalizacaoPdf}
              className="bg-amber-500 hover:bg-amber-600 text-white border-0"
            >
              <Download className="w-4 h-4 mr-2" />
              Baixar PDF
            </Button>
          </div>
        </div>

        {PLAN.sections.map((section) => (
          <div key={section.title} className="bg-white rounded-3xl border border-stone-200 shadow-sm p-8 mb-6">
            <h2 className="text-lg font-bold text-stone-800 mb-1">{section.title}</h2>
            {section.note && <p className="text-sm text-stone-500 mb-4">{section.note}</p>}

            {section.kind === 'table' && (
              <>
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-stone-800 text-white">
                        {section.columns.map((col) => (
                          <th key={col} className="text-left font-semibold px-3 py-2">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {section.rows.map((row, ri) => (
                        <tr key={ri} className={ri % 2 === 1 ? 'bg-stone-50' : ''}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-3 py-2.5 text-stone-700 align-top">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {section.footer && (
                  <p className="mt-4 text-sm font-semibold text-amber-700 border-t border-stone-200 pt-3">
                    {section.footer}
                  </p>
                )}
              </>
            )}

            {section.kind === 'bullets' && (
              <ul className="space-y-2.5 mt-4">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-stone-700 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {section.kind === 'checklist' && (
              <ul className="space-y-2.5 mt-4">
                {section.items.map((item, i) => (
                  <li key={i} className="flex gap-3 text-sm text-stone-700 leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {section.kind === 'bullets' && section.footer && (
              <p className="mt-4 text-sm font-semibold text-amber-700">{section.footer}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}