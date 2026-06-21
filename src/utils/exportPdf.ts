import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getEventLabel } from '../data/events'
import { formatSwimTime, formatDate } from '../lib/time'
import type { SwimResult, Swimmer } from '../types'
import { generateSynopsis } from './synopsis'

export function exportMeetReport(swimmer: Swimmer, results: SwimResult[]) {
  const doc = new jsPDF()
  const swimmerResults = results.filter((r) => r.swimmerId === swimmer.id)

  doc.setFillColor(2, 132, 199)
  doc.rect(0, 0, 220, 36, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.text('SwimTrack Meet Report', 14, 16)
  doc.setFontSize(10)
  doc.text(`${swimmer.name} · Age ${swimmer.age} · ${swimmer.club}`, 14, 26)

  let y = 44
  doc.setTextColor(30, 41, 59)
  doc.setFontSize(10)
  generateSynopsis(swimmer, swimmerResults).forEach((p) => {
    const lines = doc.splitTextToSize(p, 180)
    doc.text(lines, 14, y)
    y += lines.length * 5 + 4
  })

  y += 4
  autoTable(doc, {
    startY: y,
    head: [['Date', 'Event', 'Time', 'Meet', 'Pool', 'PR']],
    body: swimmerResults.map((r) => [
      formatDate(r.date),
      getEventLabel(r.event),
      formatSwimTime(r.timeSeconds),
      r.meet,
      r.poolType,
      r.isPR ? 'Yes' : '',
    ]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [14, 165, 233] },
  })

  doc.save(`SwimTrack-${swimmer.name.replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`)
}