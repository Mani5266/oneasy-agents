import { Document, Packer } from 'docx';
import { PAGE_W, PAGE_H, MAR_TOP, MAR_RIGHT, MAR_BOT, MAR_LEFT, NUMBERING } from './constants';
import { makeHeader, makeFooter } from './headerFooter';
import * as numberUtils from './numberUtils';
import { getOfferLetter } from './sections/offerLetter';
import { getAppointmentLetter } from './sections/appointmentLetter';
import { getAnnexureA } from './sections/annexureA';
import { getAnnexureB } from './sections/annexureB';
import type { OfferPayload } from '../../types';

function buildContext(d: OfferPayload) {
  const { formatINR, toWords, buildBreakdown, formatDate, formatTime } = numberUtils;

  const year = new Date().getFullYear();
  const ctc = parseInt(String(d.annualCTC)) || 0;
  const ctcWords = toWords(ctc);
  const breakdown = buildBreakdown(ctc);
  const firstName = (d.empFullName || '').split(' ')[0];
  const salute = d.salutation || 'Mr.';
  const orgName = d.orgName || '';
  const workDays = `${d.workDayFrom || 'Monday'} to ${d.workDayTo || 'Saturday'}`;
  const workTime = `${formatTime(d.workStart) || '10:30 AM'} to ${formatTime(d.workEnd) || '7:30 PM'} IST`;

  const monthlyLeaveNum = parseFloat(d.monthlyLeave || '1.5') || 1.5;
  const annualLeave = Math.round(monthlyLeaveNum * 12);

  return {
    year, ctc, ctcWords, breakdown, firstName, salute, orgName,
    workDays, workTime, monthlyLeaveNum, annualLeave,
  };
}

export async function generateDoc(d: OfferPayload): Promise<Buffer> {
  const ctx = buildContext(d);

  // Parse company logo from base64 data URL
  let logoBuffer: Buffer | null = null;
  if (d.companyLogo && d.companyLogo.startsWith('data:image')) {
    try {
      const base64Data = d.companyLogo.split(',')[1];
      if (base64Data) logoBuffer = Buffer.from(base64Data, 'base64');
    } catch { /* ignore invalid logo data */ }
  }

  const pageProps = {
    page: {
      size: { width: PAGE_W, height: PAGE_H },
      margin: { top: MAR_TOP, right: MAR_RIGHT, bottom: MAR_BOT, left: MAR_LEFT, header: 708, footer: 708 },
    },
    titlePage: true,
  };

  const header = makeHeader(d.orgName || '', d.cin || '', logoBuffer);

  const offerLetter = getOfferLetter(d, ctx);
  const appointmentLetter = getAppointmentLetter(d, ctx);
  const annexureA = getAnnexureA(d, ctx);
  const annexureB = getAnnexureB(d, ctx);

  const doc = new Document({
    numbering: NUMBERING,
    styles: {
      default: {
        document: { run: { font: 'Calibri', size: 22, color: '000000' } },
      },
    },
    sections: [{
      properties: pageProps,
      headers: { first: header },
      children: [
        ...offerLetter,
        ...appointmentLetter,
        ...annexureA,
        ...annexureB,
      ],
    }],
  });

  return Packer.toBuffer(doc) as Promise<Buffer>;
}
