"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import type { FormData } from "../../types";
import {
  isForeignPurpose,
  getCurrencyInfo,
  getPurposePhrase,
  getPossessivePronoun,
  formatCertDate,
  formatINR,
  formatForeign,
  parseAmount,
  computeTotals,
  buildSavingsRows,
  buildMovableRows,
  numberToWordsINR,
  deriveAssessmentYear,
} from "../../lib/utils";

// Register a serif font (Times-like) for the certificate
Font.register({
  family: "Serif",
  fonts: [
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman@1.0.4/Times New Roman.ttf", fontWeight: "normal" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman-bold@1.0.4/Times New Roman Bold.ttf", fontWeight: "bold" },
    { src: "https://cdn.jsdelivr.net/npm/@canvas-fonts/times-new-roman-italic@1.0.4/Times New Roman Italic.ttf", fontStyle: "italic" },
  ],
});

const s = StyleSheet.create({
  page: {
    paddingTop: 45,
    paddingBottom: 40,
    paddingHorizontal: 45,
    fontFamily: "Serif",
    fontSize: 11,
    lineHeight: 1.7,
    color: "#111",
  },
  center: { textAlign: "center" },
  bold: { fontWeight: "bold" },
  italic: { fontStyle: "italic" },
  heading: { textAlign: "center", fontWeight: "bold", fontSize: 13, marginBottom: 3 },
  title: { textAlign: "center", fontWeight: "bold", fontSize: 15, textDecoration: "underline", marginBottom: 18 },
  body: { textAlign: "justify", marginBottom: 12 },
  table: { width: "100%", marginBottom: 14 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#000" },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderTopWidth: 1, borderColor: "#000", backgroundColor: "#fff" },
  th: { fontWeight: "bold", fontSize: 10, padding: 5, borderRightWidth: 1, borderLeftWidth: 1, borderColor: "#000" },
  td: { fontSize: 10, padding: 5, borderRightWidth: 1, borderLeftWidth: 1, borderColor: "#000" },
  annexTitle: { fontWeight: "bold", fontSize: 12, marginTop: 16, marginBottom: 4 },
  annexSubtitle: { fontSize: 10, fontStyle: "italic", color: "#374151", marginBottom: 6 },
  sigBlock: { marginTop: 28 },
  sigLine: { marginBottom: 2 },
  docList: { marginLeft: 16, marginBottom: 14 },
  docItem: { marginBottom: 2, fontSize: 10 },
  note: { fontSize: 9, color: "#666", textAlign: "right", marginBottom: 14 },
});

interface Props {
  data: FormData;
}

function AnnexTable({ rows, total, foreignValues, foreignTotal, currencyLabel }: {
  rows: { label: string; inr: string }[];
  total: number;
  foreignValues?: string[];
  foreignTotal?: number;
  currencyLabel?: string;
}) {
  const showForeign = !!currencyLabel;
  return (
    <View style={s.table} wrap={false}>
      <View style={s.tableHeader}>
        <Text style={[s.th, { width: "55%" }]}>Particulars</Text>
        <Text style={[s.th, { width: showForeign ? "22%" : "45%", textAlign: "right" }]}>Indian (Rs.)</Text>
        {showForeign && <Text style={[s.th, { width: "23%", textAlign: "right" }]}>{currencyLabel}</Text>}
      </View>
      {rows.map((row, i) => (
        <View style={s.tableRow} key={i}>
          <Text style={[s.td, { width: "55%" }]}>{row.label}</Text>
          <Text style={[s.td, { width: showForeign ? "22%" : "45%", textAlign: "right" }]}>{row.inr ? formatINR(parseAmount(row.inr)) : ""}</Text>
          {showForeign && <Text style={[s.td, { width: "23%", textAlign: "right" }]}>{foreignValues?.[i] || ""}</Text>}
        </View>
      ))}
      <View style={s.tableRow}>
        <Text style={[s.td, { width: "55%", fontWeight: "bold" }]}>Total</Text>
        <Text style={[s.td, { width: showForeign ? "22%" : "45%", textAlign: "right", fontWeight: "bold" }]}>{formatINR(total)}</Text>
        {showForeign && <Text style={[s.td, { width: "23%", textAlign: "right", fontWeight: "bold" }]}>{foreignTotal ? formatForeign(foreignTotal) : ""}</Text>}
      </View>
    </View>
  );
}

export function CertificatePDF({ data }: Props) {
  const isF = isForeignPurpose(data.purpose);
  const name = `${data.salutation} ${data.fullName || "[Name of Applicant]"}`;
  const dateStr = formatCertDate(data.certDate);
  const purposeTxt = getPurposePhrase(data.purpose, data.country);
  const totals = computeTotals(data);
  const pronoun = getPossessivePronoun(data.salutation);
  const ay = data.assessmentYear || deriveAssessmentYear(data.certDate);

  const incRows = data.incomeTypes.length > 0
    ? data.incomeTypes.map((person, i) => {
        const personName = data.incomeLabels[person]?.trim()
          || (person === "Self" ? (data.fullName || "[Name]") : "[Name]");
        const base = person === "Self"
          ? "Annual Income of the Applicant"
          : `Annual Income of the Applicant\u2019s ${person}`;
        const label = `${base} \u2013 ${personName} for the Assessment year ${ay}`;
        return { label, inr: data.incomeRows[i]?.inr ?? "" };
      })
    : [{ label: "Annual Income of the Applicant", inr: "" }];

  const hasNewModel = Object.keys(data.immovableProperties ?? {}).length > 0;
  const immRows = hasNewModel
    ? (data.immovableRows.length > 0 ? data.immovableRows : [{ label: "Address of the immovable property and its details.", inr: "" }])
    : data.immovableRows.map((row, i) => {
        if (i === 0 && data.propertyAddress) return { ...row, label: `Address of the immovable property \u2014 ${data.propertyAddress}` };
        return row;
      });

  const hasNewMovableModel = Object.keys(data.movableAssets ?? {}).length > 0;
  const movRows = hasNewMovableModel
    ? (data.movableRows.length > 0 ? data.movableRows : [{ label: "Specify movable asset details", inr: "" }])
    : buildMovableRows(data).map((row, i) => ({ ...row, inr: data.movableRows[i]?.inr || "" }));

  const hasNewSavingsModel = Object.keys(data.savingsEntries ?? {}).length > 0;
  const savRows = hasNewSavingsModel
    ? ((data.savingsRows ?? []).length > 0 ? (data.savingsRows ?? []) : [{ label: "Savings Details", inr: "" }])
    : buildSavingsRows(data).map((row, i) => ({ ...row, label: row.label || `Savings Entry ${i + 1}`, inr: data.savingsRows?.[i]?.inr || "" }));

  const incomeFileNames = Object.values(data.incomeDocs).flatMap(docs => docs.map(d => d.name));
  const immovableFileNames = Object.values(data.immovableDocs).flatMap(docs => docs.map(d => d.name));
  const movableFileNames = Object.values(data.movableDocs).flatMap(docs => docs.map(d => d.name));
  const savingsFileNames = Object.values(data.savingsDocs).flatMap(docs => docs.map(d => d.name));
  const baseDocs = data.supportingDocs.length > 0 ? data.supportingDocs : ["Income tax return copies of Applicant.", "Valuation/self-declaration documents of immovable properties."];
  const otherDocs = (data.otherSupportingDocs ?? []).filter((d: string) => d.trim() !== "");
  const docs = [...baseDocs, ...otherDocs, ...incomeFileNames, ...immovableFileNames, ...movableFileNames, ...savingsFileNames];

  const cl = data.country || "Foreign Currency";
  const currInfo = getCurrencyInfo(data.country);
  const overrideRate = data.exchangeRate ? parseFloat(data.exchangeRate) : null;
  const rate = (overrideRate && overrideRate > 0) ? overrideRate : currInfo.fallbackRate;

  const computeRowForeign = (rows: { inr: string }[], frArr: string[]) => {
    const hasManual = frArr.some(v => v.trim() !== "");
    return rows.map((row, i) => {
      if (hasManual && frArr[i]?.trim()) return frArr[i];
      const inrVal = row.inr ? parseAmount(row.inr) : 0;
      return inrVal ? String(Math.round((inrVal / rate) * 100) / 100) : "";
    });
  };

  const incFR = computeRowForeign(incRows, data.incomeFR ?? []);
  const immFR = computeRowForeign(immRows, data.immovableFR ?? []);
  const movFR = computeRowForeign(movRows, data.movableFR ?? []);
  const savFR = computeRowForeign(savRows, data.savingsFR ?? []);

  const getDisplayTypes = (types: string[]) => types.join(", ");

  const summaryRows = [
    { n: "1.", l: "Current Income", v: formatINR(totals.incomeINR), f: formatForeign(totals.incomeForeign), r: "I" },
    { n: "2.", l: "Immovable Assets", v: formatINR(totals.immovableINR), f: formatForeign(totals.immovableForeign), r: "II" },
    { n: "3.", l: "Movable Properties", v: formatINR(totals.movableINR), f: formatForeign(totals.movableForeign), r: "III" },
    { n: "4.", l: "Current Savings", v: formatINR(totals.savingsINR), f: formatForeign(totals.savingsForeign), r: "IV" },
  ];

  return (
    <Document>
      <Page size="A4" style={s.page} wrap>
        <Text style={s.heading}>TO WHOMSOEVER IT MAY CONCERN</Text>
        <Text style={s.title}>NETWORTH CERTIFICATE</Text>

        <Text style={s.body}>
          I, <Text style={s.bold}>{data.signatoryName || "[Signatory Name]"}</Text>, member of The Institute of Chartered Accountants of India, do hereby certify that I have reviewed the financial condition of the Applicant, <Text style={s.bold}>{name}</Text>, with the view to furnish {pronoun} net worth <Text style={s.italic}>{purposeTxt}</Text>. The Below detail of the assets are obtained as on <Text style={s.bold}>{dateStr}</Text>
        </Text>

        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.th, { width: "8%" }]}>Sl. No.</Text>
            <Text style={[s.th, { width: isF ? "34%" : "42%" }]}>SOURCES OF FUNDS</Text>
            <Text style={[s.th, { width: isF ? "20%" : "30%", textAlign: "right" }]}>INDIAN (Rs.)</Text>
            {isF && <Text style={[s.th, { width: "18%", textAlign: "right" }]}>{cl}</Text>}
            <Text style={[s.th, { width: "20%", textAlign: "center" }]}>REFERENCE (ANNEXURES)</Text>
          </View>
          {summaryRows.map((row) => (
            <View style={s.tableRow} key={row.n}>
              <Text style={[s.td, { width: "8%", textAlign: "center", fontWeight: "bold" }]}>{row.n}</Text>
              <Text style={[s.td, { width: isF ? "34%" : "42%", fontWeight: "bold" }]}>{row.l}</Text>
              <Text style={[s.td, { width: isF ? "20%" : "30%", textAlign: "right", fontWeight: "bold" }]}>{row.v}</Text>
              {isF && <Text style={[s.td, { width: "18%", textAlign: "right", fontWeight: "bold" }]}>{row.f}</Text>}
              <Text style={[s.td, { width: "20%", textAlign: "center", fontWeight: "bold" }]}>{row.r}</Text>
            </View>
          ))}
          <View style={s.tableRow}>
            <Text style={[s.td, { width: isF ? "42%" : "50%", fontWeight: "bold" }]}>Total</Text>
            <Text style={[s.td, { width: isF ? "20%" : "30%", textAlign: "right", fontWeight: "bold" }]}>{formatINR(totals.grandINR)}</Text>
            {isF && <Text style={[s.td, { width: "18%", textAlign: "right", fontWeight: "bold" }]}>{formatForeign(totals.grandForeign)}</Text>}
            <Text style={[s.td, { width: "20%" }]}></Text>
          </View>
          <View style={s.tableRow}>
            <Text style={[s.td, { width: "100%", fontSize: 9, fontStyle: "italic", color: "#374151" }]}>
              ({numberToWordsINR(totals.grandINR)})
            </Text>
          </View>
        </View>

        {overrideRate && isF && (
          <Text style={s.note}>
            * Foreign currency converted at the rate of 1 {currInfo.code} = Rs.{overrideRate.toFixed(2)} as on {dateStr}
          </Text>
        )}

        <Text style={{ marginBottom: 5 }}>
          The above figures are compiled from the following documents and certificates submitted before me:
        </Text>
        <View style={s.docList}>
          {docs.map((doc, i) => (
            <Text key={i} style={s.docItem}>{i + 1}. {doc}</Text>
          ))}
        </View>

        <View wrap={false}>
          <Text style={s.annexTitle}>ANNEXURE-I    CURRENT INCOME</Text>
          {data.incomeTypes.length > 0 && (
            <Text style={s.annexSubtitle}>Income Declared For: {getDisplayTypes(data.incomeTypes)}</Text>
          )}
          <AnnexTable rows={incRows} total={totals.incomeINR} foreignValues={isF ? incFR : undefined} foreignTotal={isF ? totals.incomeForeign : undefined} currencyLabel={isF ? cl : undefined} />
        </View>

        <View wrap={false}>
          <Text style={s.annexTitle}>ANNEXURE – II    IMMOVABLE ASSETS</Text>
          {data.immovableTypes.length > 0 && (
            <Text style={s.annexSubtitle}>Properties Declared For: {getDisplayTypes(data.immovableTypes)}</Text>
          )}
          <AnnexTable rows={immRows} total={totals.immovableINR} foreignValues={isF ? immFR : undefined} foreignTotal={isF ? totals.immovableForeign : undefined} currencyLabel={isF ? cl : undefined} />
        </View>

        <View wrap={false}>
          <Text style={s.annexTitle}>ANNEXURE – III    MOVABLE PROPERTIES</Text>
          {data.movableTypes.length > 0 && (
            <Text style={s.annexSubtitle}>Assets Declared For: {getDisplayTypes(data.movableTypes)}</Text>
          )}
          <AnnexTable rows={movRows} total={totals.movableINR} foreignValues={isF ? movFR : undefined} foreignTotal={isF ? totals.movableForeign : undefined} currencyLabel={isF ? cl : undefined} />
        </View>

        <View wrap={false}>
          <Text style={s.annexTitle}>ANNEXURE – IV    CURRENT SAVINGS</Text>
          {data.savingsTypes.length > 0 && (
            <Text style={s.annexSubtitle}>Savings Declared For: {getDisplayTypes(data.savingsTypes)}</Text>
          )}
          <AnnexTable rows={savRows} total={totals.savingsINR} foreignValues={isF ? savFR : undefined} foreignTotal={isF ? totals.savingsForeign : undefined} currencyLabel={isF ? cl : undefined} />
        </View>

        <View style={s.sigBlock} wrap={false}>
          <Text style={[s.sigLine, s.bold]}>For {data.firmName || "[Firm Name]"},</Text>
          <Text style={s.sigLine}>Chartered Accountants,</Text>
          <Text style={[s.sigLine, { marginBottom: 14 }]}>FRN {data.firmFRN || "[FRN]"}</Text>
          <Text style={[s.sigLine, s.bold]}>{data.signatoryName || "[Signatory Name]"}</Text>
          <Text style={s.sigLine}>{data.signatoryTitle || "[Designation]"}</Text>
          <Text style={[s.sigLine, { marginBottom: 14 }]}>Membership No. {data.membershipNo || "[Membership No.]"}</Text>
          <Text style={s.sigLine}>Date: {dateStr}</Text>
          <Text style={s.sigLine}>Place: {data.signPlace || "[Place]"}</Text>
          <Text style={s.sigLine}>UDIN: {data.udin || "__________________________"}</Text>
        </View>
      </Page>
    </Document>
  );
}
