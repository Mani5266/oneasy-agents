// -- Step3Review Component ---------------------------------------------------
// Step 3: Review & Generate pane.

'use client';

import React, { useMemo, useCallback, useState } from 'react';
import DOMPurify from 'dompurify';
import { useWizardStore } from '../hooks/useWizardStore';
import { useGenerate } from '../hooks/useGenerate';
import { escapeHTML, fmtDate, safeNumber } from '../lib/utils';
import { getPartyLabel } from '../types';
import { usePaymentGate } from '@/hooks/usePaymentGate';
import { buildPartnershipHtml } from '../lib/buildPartnershipHtml';

interface Step3ReviewProps {
  onPrev: () => void;
}

// ---------------------------------------------------------------------------
// BuildReview — collapsible review summary
// ---------------------------------------------------------------------------

function BuildReview() {
  const partners = useWizardStore((s) => s.partners);
  const businessName = useWizardStore((s) => s.businessName);
  const deedDate = useWizardStore((s) => s.deedDate);
  const natureOfBusiness = useWizardStore((s) => s.natureOfBusiness);
  const registeredAddress = useWizardStore((s) => s.registeredAddress);
  const businessObjectives = useWizardStore((s) => s.businessObjectives);
  const partnershipDuration = useWizardStore((s) => s.partnershipDuration);
  const partnershipStartDate = useWizardStore((s) => s.partnershipStartDate);
  const partnershipEndDate = useWizardStore((s) => s.partnershipEndDate);
  const bankOperation = useWizardStore((s) => s.bankOperation);
  const interestRate = useWizardStore((s) => s.interestRate);
  const noticePeriod = useWizardStore((s) => s.noticePeriod);
  const accountingYear = useWizardStore((s) => s.accountingYear);
  const additionalPoints = useWizardStore((s) => s.additionalPoints);

  const sections = useMemo(() => {
    const result: { title: string; rows: [string, string][] }[] = [];

    partners.forEach((p, i) => {
      const roles: string[] = [];
      if (p.isManagingPartner) roles.push('Managing Partner');
      if (p.isBankAuthorized) roles.push('Bank Authorized');
      result.push({
        title: `Partner ${i + 1} (${getPartyLabel(i)} Party)`,
        rows: [
          ['Name', p.name || ''],
          ['Relation', `${p.relation || 'S/O'} ${p.fatherName || ''}`],
          ['Age', p.age ? `${p.age} years` : ''],
          ['Address', p.address || ''],
          ['Roles', roles.length > 0 ? roles.join(', ') : 'None assigned'],
        ],
      });
    });

    let durationDisplay = 'At Will of the Partners';
    if (partnershipDuration === 'fixed') {
      const start = fmtDate(partnershipStartDate);
      const end = fmtDate(partnershipEndDate);
      durationDisplay = `Fixed Duration: ${start} to ${end}`;
    }
    const bizRows: [string, string][] = [
      ['Business Name', `M/s. ${businessName}`],
      ['Date of Deed', fmtDate(deedDate)],
      ['Duration', durationDisplay],
      ['Nature', natureOfBusiness],
      ['Registered Address', registeredAddress],
    ];
    if (businessObjectives) {
      bizRows.push([
        'Business Objective',
        businessObjectives.length > 120
          ? businessObjectives.substring(0, 120) + '...'
          : businessObjectives,
      ]);
    }
    result.push({ title: 'Business Details', rows: bizRows });

    result.push({
      title: 'Capital Contribution',
      rows: partners.map((p, i) => [
        `Partner ${i + 1}${p.name ? ' (' + p.name + ')' : ''}`,
        `${safeNumber(p.capital)}%`,
      ]),
    });
    result.push({
      title: 'Profit / Loss Sharing',
      rows: partners.map((p, i) => [
        `Partner ${i + 1}${p.name ? ' (' + p.name + ')' : ''}`,
        `${safeNumber(p.profit)}%`,
      ]),
    });

    const managingNames = partners
      .filter((p) => p.isManagingPartner)
      .map((p) => p.name || 'Unnamed')
      .join(', ');
    const bankAuthNames = partners
      .filter((p) => p.isBankAuthorized)
      .map((p) => p.name || 'Unnamed')
      .join(', ');

    result.push({
      title: 'Clauses',
      rows: [
        ['Managing Partner(s)', managingNames || 'None selected'],
        ['Bank Authorized Partner(s)', bankAuthNames || 'None selected'],
        ['Bank Operation', bankOperation === 'either' ? 'Either partner independently' : 'Jointly'],
        ['Interest Rate', `${interestRate || '12'}% p.a.`],
        ['Notice Period', `${noticePeriod || '3'} months`],
        ['Accounting Year', accountingYear || '31st March'],
        ['Additional Terms', additionalPoints || 'None'],
      ],
    });

    return result;
  }, [
    partners, businessName, deedDate, natureOfBusiness, registeredAddress,
    businessObjectives, partnershipDuration, partnershipStartDate,
    partnershipEndDate, bankOperation, interestRate, noticePeriod,
    accountingYear, additionalPoints,
  ]);

  return (
    <details open style={{ marginBottom: 'var(--space-6)' }}>
      <summary className="form-card-title" style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="2" />
        </svg>
        Review Your Data
      </summary>

      <div className="review-grid" style={{ marginTop: 'var(--space-4)' }}>
        {sections.map((section) => (
          <div key={section.title} className="review-card">
            <div className="review-card-title">{section.title}</div>
            {section.rows.map(([label, value]) => (
              <div key={label} className="review-row">
                <span className="review-label">{label}</span>
                <span className="review-value">{value || '\u2014'}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
// DeedPreview — inline editable HTML preview
// ---------------------------------------------------------------------------

function DeedPreview() {
  const partners = useWizardStore((s) => s.partners);
  const businessName = useWizardStore((s) => s.businessName);
  const deedDate = useWizardStore((s) => s.deedDate);
  const natureOfBusiness = useWizardStore((s) => s.natureOfBusiness);
  const registeredAddress = useWizardStore((s) => s.registeredAddress);
  const businessObjectives = useWizardStore((s) => s.businessObjectives);
  const interestRate = useWizardStore((s) => s.interestRate);
  const noticePeriod = useWizardStore((s) => s.noticePeriod);
  const accountingYear = useWizardStore((s) => s.accountingYear);
  const bankOperation = useWizardStore((s) => s.bankOperation);
  const additionalPoints = useWizardStore((s) => s.additionalPoints);
  const partnershipDuration = useWizardStore((s) => s.partnershipDuration);
  const partnershipStartDate = useWizardStore((s) => s.partnershipStartDate);
  const partnershipEndDate = useWizardStore((s) => s.partnershipEndDate);

  const html = useMemo(() => {
    const biz = escapeHTML(businessName || '_______________');
    const date = fmtDate(deedDate) || 'the _______ day of _______ 20___';
    const addr = escapeHTML(registeredAddress || '_______________');
    const nature = escapeHTML(natureOfBusiness || '_______________');
    const objectives = escapeHTML(businessObjectives || '_______________');
    const rate = escapeHTML(interestRate || '12');
    const notice = escapeHTML(noticePeriod || '3');
    const acctYear = escapeHTML(accountingYear || '31st March');
    const bankOp = bankOperation || 'jointly';
    const addlPts = additionalPoints || '';

    const partnerIntros = partners
      .map((p, i) => {
        const name = escapeHTML(p.name || '_______________');
        const rel = escapeHTML(p.relation || 'S/O');
        const father = escapeHTML(p.fatherName || '_______________');
        const age = escapeHTML(String(p.age || '___'));
        const address = escapeHTML(p.address || '_______________');
        const label = getPartyLabel(i);
        let h = `<p><strong>${name}</strong> ${rel} <strong>${father}</strong> Aged <strong>${age}</strong> Years, residing at ${address}.</p>`;
        h += `<p>(Hereinafter called as the <strong><em>&ldquo;${label} Party&rdquo;</em></strong>)</p>`;
        if (i < partners.length - 1) {
          h += `<p style="text-align:center"><strong>AND</strong></p>`;
        }
        return h;
      })
      .join('\n');

    const capitalBullets = partners
      .map((p, i) => {
        const name = escapeHTML(p.name || '_______________');
        const label = getPartyLabel(i);
        const cap = escapeHTML(String(safeNumber(p.capital) || '___'));
        return `<li><strong>${label} Party (${name}):</strong> ${cap}%</li>`;
      })
      .join('\n');

    const profitBullets = partners
      .map((p, i) => {
        const name = escapeHTML(p.name || '_______________');
        const label = getPartyLabel(i);
        const prof = escapeHTML(String(safeNumber(p.profit) || '___'));
        return `<li><strong>${name}</strong> (${label} Party) - ${prof}%</li>`;
      })
      .join('\n');

    let durationText = 'The duration of the firm shall be at WILL of the partners.';
    if (partnershipDuration === 'fixed' && partnershipStartDate && partnershipEndDate) {
      durationText = `The duration of the partnership shall be for a fixed period commencing from <strong>${fmtDate(partnershipStartDate)}</strong> and ending on <strong>${fmtDate(partnershipEndDate)}</strong>, unless terminated earlier by mutual consent of all the partners or by operation of law.`;
    }

    const managingPartnersList = partners
      .map((p, i) => ({ ...p, _index: i }))
      .filter((p) => p.isManagingPartner);
    const effectiveManagingPartners =
      managingPartnersList.length > 0
        ? managingPartnersList
        : partners.map((p, i) => ({ ...p, _index: i }));

    const managingPartnersText = effectiveManagingPartners
      .map((p, i) => {
        const sep = i > 0 ? ' &amp; ' : '';
        return `${sep}<strong>${escapeHTML(p.name || 'N/A')}</strong> (${getPartyLabel(p._index)} Party)`;
      })
      .join('');

    const pluralMgr = effectiveManagingPartners.length > 1;

    const managingPowers = [
      'To manage the business of the partnership firm with a power to appoint remuneration, etc. They shall also have the power to dispense with the service of such personnel that are not required.',
      'To negotiate any business transactions and enter into agreements on behalf of the firm and to enter into all/any contracts and sub-contracts on either way. To enter to the sale and purchase agreements relating to the objective of the business.',
      'To enter into correspondence with government departments, quasi-govt departments, public and private organizations, individuals, etc regarding the partnership business.',
      'To incur all expenses necessary for the conduct of the business.',
      'To borrow moneys against credit of partnership, if necessary by hypothecating or creating a charge upon the assets of the partnership.',
      'To be in custody of all account books, documents, negotiable instruments and all other documents pertaining to the business.',
      'To look after the proper upkeep of books of accounts required for the business and to supervise the same at regular intervals.',
      'To open bank account/accounts in the name of the partnership firm.',
      'To put all the monies, cheques etc., which are not immediately required for the conduct of the business into the bank account, opened for the Partnership business.',
      'To do all other acts and things that are necessary for carrying on the business.',
    ];
    const managingPowersList = managingPowers.map((p) => `<li>${p}</li>`).join('\n');

    const bankAuthPartners = partners
      .map((p, i) => ({ ...p, _index: i }))
      .filter((p) => p.isBankAuthorized);
    const bankConnector = bankOp === 'either' ? ' or ' : ' and ';

    let bankingText = '';
    if (bankAuthPartners.length > 0) {
      const bankNames = bankAuthPartners
        .map((p, i) => {
          let sep = '';
          if (i > 0 && i < bankAuthPartners.length - 1) sep = ', ';
          else if (i === bankAuthPartners.length - 1 && bankAuthPartners.length > 1) sep = bankConnector;
          return `${sep}<strong>${escapeHTML(p.name || 'N/A')}</strong> (${getPartyLabel(p._index)} Party)`;
        })
        .join('');
      if (bankOp === 'either') {
        bankingText = `The firm shall maintain one or more banking accounts as may be decided by the partners from time to time. The said bank accounts shall be operated by ${bankNames}, ${bankAuthPartners.length === 1 ? 'who is' : 'either of whom is'} independently authorized for all bank-related transactions including the issuance and authorization of cheques, demand drafts, and any other banking instruments on behalf of the firm.`;
      } else {
        bankingText = `The firm shall maintain one or more banking accounts as may be decided by the partners from time to time. The said bank accounts shall be operated by ${bankNames}, who ${bankAuthPartners.length === 1 ? 'is' : 'are jointly'} authorized for all bank-related transactions including the issuance and authorization of cheques, demand drafts, and any other banking instruments on behalf of the firm. No transaction shall be deemed valid unless signed by all the above-named authorized partners.`;
      }
    } else {
      bankingText =
        'The firm shall maintain one or more banking accounts as may be decided by the partners from time to time. The said bank accounts may be operated by any partner independently.';
    }

    const nextClause = addlPts.trim() ? 8 : 7;

    const partnerSigRows = partners
      .map((p, i) => `<p>${i + 1}. ${escapeHTML(p.name || '________________________')}</p><p style="margin-left:1em">(${getPartyLabel(i)} Party)</p>`)
      .join('');

    return `
      <h1 style="text-align:center; font-size:16pt; text-decoration:underline; text-transform:uppercase; font-weight:bold; margin-bottom:0.5em;">Partnership Deed</h1>

      <p>This Deed of Partnership is made and executed on <strong>${date}</strong>, by and between:</p>

      ${partnerIntros}

      <br>

      <p><strong>WHEREAS</strong> the parties here have mutually decided to start a partnership business of <strong>${nature}</strong> under the name and style as <strong>M/s. ${biz}</strong>.</p>

      <p><strong>AND WHEREAS</strong> it is felt expedient to reduce the terms and conditions agreed upon by the above said continuing partners into writing to avoid any misunderstandings amongst the partners at a future date.</p>

      <br>

      <p style="text-align:center; font-weight:bold; font-size:12pt; margin:1.5em 0 1em;">NOW THIS DEED OF PARTNERSHIP WITNESSETH AS FOLLOWS:</p>

      <p><strong>1. Name and Commencement</strong></p>
      <p>The partnership business shall be carried on under the name and style as <strong>M/s. ${biz}</strong>. The partnership firm shall come into existence with effect from <strong>${date}</strong>.</p>

      <p><strong>2. Duration</strong></p>
      <p>${durationText}</p>

      <p><strong>3. Principal Place of Business</strong></p>
      <p>The Principal place of business of the firm shall be at <strong>${addr}</strong>.</p>

      <p><strong>4. Objectives of Partnership</strong></p>
      <p>The objective of partnership is to carry on the following business:</p>
      <p style="margin-left:2em">${objectives}</p>

      <p><strong>5. Capital Contribution of the Partners</strong></p>
      <p>The total capital contribution of the partners in the firm shall be in the following proportions:</p>
      <ul>${capitalBullets}</ul>

      <p><strong>6. Managing Partners</strong></p>
      <p>The parties ${managingPartnersText} shall be the managing partner${pluralMgr ? 's' : ''} and ${pluralMgr ? 'are' : 'is'} authorized and empowered to do the following acts, deeds and things on behalf of the firm:</p>
      <ol>${managingPowersList}</ol>
      <p>The managing partners are empowered to borrow money as and when found necessary for the business from any nationalized or schedule bank/banks or any other financial institutions from time to time and execute necessary actions at all the times.</p>

      ${addlPts.trim() ? `
      <p><strong>7. Additional Terms</strong></p>
      <p>${escapeHTML(addlPts)}</p>
      ` : ''}

      <p><strong>${nextClause}. Banking</strong></p>
      <p>${bankingText}</p>

      <p><strong>${nextClause + 1}. Authorized Signatory</strong></p>
      <p>The partners, upon mutual consent of all the partners of this partnership deed appoint any another individual as the authorized signatory for entering into the agreements relating to sale and purchase of the land or/and building.</p>

      <p><strong>${nextClause + 2}. Working Partners and Remuneration</strong></p>
      <p>That all the partners shall be working partners of the firm and shall be bound to devote full time and attention to the partnership business and shall be actively engaged in conducting the affairs of the firm and therefore it has been agreed to pay salary/remuneration for the services rendered as per the provisions under section 40(b) of the Income Tax Act, 1961.</p>

      <p><strong>${nextClause + 3}. Interest on Capital</strong></p>
      <p>That the interest at the rate of ${rate}% per annum or as may be prescribed u/s.40(b)(iv) of the Income Tax Act, 1961 shall be payable to the partners on the amount standing to the credit of the account of the partners.</p>

      <p><strong>${nextClause + 4}. Books of Accounts</strong></p>
      <p>The books of accounts of the partnership shall be maintained at the principal place of business and the same shall be closed on the <strong>${acctYear}</strong> every year.</p>

      <p><strong>${nextClause + 5}. Profit and Loss Sharing</strong></p>
      <p>That the share of the profits or losses of partnership business after taking into account all business and incidental expenses will be as follows:</p>
      <ul>${profitBullets}</ul>

      <p><strong>${nextClause + 6}. Retirement</strong></p>
      <p>Any partner desirous of retiring from the partnership during its continuance can exercise his/her right by giving ${notice} calendar months&rsquo; notice to the other partner(s).</p>

      <p><strong>${nextClause + 7}. Death, Retirement or Insolvency</strong></p>
      <p>Death, retirement or insolvency of any of the partners shall not dissolve the partnership.</p>

      <p><strong>${nextClause + 8}. Arbitration</strong></p>
      <p>Any dispute that may arise between the partners shall be referred to an arbitrator whose award shall be final and binding on the parties MUTATIS MUTANDIS.</p>

      <p><strong>${nextClause + 9}. Applicable Law</strong></p>
      <p>The provision of the Partnership Act, 1932 as in vogue from time to time shall apply to this partnership except as otherwise stated above.</p>

      <p><strong>${nextClause + 10}. Amendments</strong></p>
      <p>Any of the terms of this Deed may be amended, abandoned or otherwise be dealt with according to the necessities of the business and convenience of the partners and they shall be reduced to writing on Rs. 100/- stamp paper.</p>

      <br><br>

      <p><strong>IN WITNESS WHEREOF</strong> the parties hereto have set hands on this the <strong>${date}</strong>.</p>

      <table style="width:100%; margin-top:2em; border-collapse:collapse;">
        <tr>
          <td style="vertical-align:top; width:50%; padding:0 1em;">
            <p><strong>WITNESSES</strong></p><br>
            <p>1. ________________________</p><br>
            <p>2. ________________________</p>
          </td>
          <td style="vertical-align:top; width:50%; padding:0 1em;">
            <p><strong>Partners</strong></p><br>
            ${partnerSigRows}
          </td>
        </tr>
      </table>
    `;
  }, [
    partners, businessName, deedDate, natureOfBusiness, registeredAddress,
    businessObjectives, interestRate, noticePeriod, accountingYear,
    bankOperation, additionalPoints, partnershipDuration,
    partnershipStartDate, partnershipEndDate,
  ]);

  return (
    <details style={{ marginBottom: 'var(--space-6)' }}>
      <summary className="form-card-title" style={{ cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14,2 14,8 20,8" />
        </svg>
        Deed Preview
      </summary>
      <div
        className="deed-preview-content"
        style={{ marginTop: 'var(--space-4)', padding: 'var(--space-6)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', maxHeight: '600px', overflowY: 'auto', fontSize: 'var(--text-base)', color: 'var(--text-main)', lineHeight: '1.7' }}
        contentEditable
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
      />
    </details>
  );
}

// ---------------------------------------------------------------------------
// Step3Review — main component
// ---------------------------------------------------------------------------

export function Step3Review({ onPrev }: Step3ReviewProps) {
  const { loading, error, showPdfBtn, generate } = useGenerate();
  const isGenerating = useWizardStore((s) => s.isGenerating);
  const currentDeedId = useWizardStore((s) => s.currentDeedId);
  const businessName = useWizardStore((s) => s.businessName);
  const { isPaid, requirePayment, paymentLoading } = usePaymentGate({ agent: 'partnership', documentId: currentDeedId });
  const [pdfLoading, setPdfLoading] = useState(false);

  const downloadPdf = useCallback(async () => {
    const el = document.querySelector('.deed-preview-content');
    if (!el) return;
    const html = buildPartnershipHtml(el.innerHTML);
    setPdfLoading(true);
    try {
      const res = await fetch('/api/partnership/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, businessName, deedId: currentDeedId }),
      });
      if (!res.ok) return;
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const name = (businessName || '').trim();
      a.download = name ? `Partnership_Deed - ${name}.pdf` : 'Partnership_Deed.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setPdfLoading(false);
    }
  }, [businessName]);

  const handleUnlock = useCallback(() => {
    requirePayment(() => {});
  }, [requirePayment]);

  return (
    <div>
      {/* Payment Gate Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginBottom: 'var(--space-4)' }}>
        {!isPaid ? (
          <button
            onClick={handleUnlock}
            disabled={paymentLoading || !currentDeedId}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 24px', borderRadius: '9999px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #1e3a5f, #2d5a8e)', color: '#fff',
              fontWeight: 700, fontSize: '14px',
              boxShadow: '0 4px 14px rgba(30,58,95,0.25)',
              transition: 'all 0.2s', opacity: paymentLoading || !currentDeedId ? 0.5 : 1,
            }}
          >
            {paymentLoading ? (
              <><span className="spinner-small" /> Processing...</>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Unlock Document
                <span style={{ padding: '2px 10px', background: 'rgba(255,255,255,0.2)', borderRadius: '9999px', fontSize: '12px', fontWeight: 800 }}>&#8377;199</span>
              </>
            )}
          </button>
        ) : (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', fontSize: '12px', fontWeight: 700,
            color: '#047857', background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '9999px',
          }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Paid
          </span>
        )}
      </div>

      {/* Review Grid */}
      <BuildReview />

      {/* Deed Preview */}
      <DeedPreview />

      {/* Error message */}
      {error && (
        <div className="field-error-msg" style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-3) var(--space-4)', marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)' }}>
          {error}
        </div>
      )}

      {/* Action buttons */}
      <div className="generate-actions">
        <button onClick={onPrev} className="btn btn-back">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        {isPaid && (
          <>
            <button
              onClick={() => generate()}
              disabled={loading || isGenerating}
              className="btn btn-gen"
            >
              {loading || isGenerating ? (
                <><span className="spinner-small" /> Generating...</>
              ) : (
                <>
                  Generate & Download DOCX
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7,10 12,15 17,10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </>
              )}
            </button>

            {showPdfBtn && (
              <button onClick={downloadPdf} disabled={pdfLoading} className="btn btn-pdf">
                {pdfLoading ? (
                  <><span className="spinner-small" /> Generating PDF...</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6,9 6,2 18,2 18,9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Download PDF
                  </>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
