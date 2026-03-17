import { jsPDF } from 'jspdf'

const TD_GREEN = [0, 138, 0]       // #008a00
const DARK = [31, 41, 55]           // gray-800
const GRAY = [107, 114, 128]        // gray-500
const LIGHT_GRAY = [229, 231, 235]  // gray-200
const WHITE = [255, 255, 255]

// TD logo as base64 PNG for PDF watermark
const TD_LOGO_B64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEQAAAA8CAYAAADfYhweAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAPeSURBVHgB7ZpbaBNZGMf/M0lM0yZtbW1t1WLqbtdddYuLUnZhXdbt4gW8PAiKDyL44IMPIuqLiHhFEATxAj6JN3xRFAXxiljxChVRUKu00UJtjbWtTdI2aSczxzNFQQ7MOVNTSno8PxgG8n0zhB9zzvnmO6PVXpweISBhKEB06z+vfdIAHQpYJjQlgkEJYVBCGJQQBiWEQQlhUEIYlBAGJYTBywv69DHUmIZshNAjTQxYxMJwwhWyveYAphb+juyEwLDSiPV/QrSvBS+7nuFZRz2a4g0ZSeIKCfkKMdZfjGymNFCGqsLfMGfCPBBC0Nj9AuciJ3Cn7RoVQzBUpJpDNE3DL2NnYOvs/dhZcxjjAuMxVKSdVP8qm4tDc86gIlg5pOu4Qkw6RtOW4eqwiMm71WDc7b0cDzqJErgfBqWBcmyZtQ9BX8j1NVrtxWlv6TmMDFk4eRk2zdzlGN9dv5GO6+vIFI/uQUlOGWYUz8Li8HJML/pDeM3p10dx8tURYZ5JrLlejDAhXwHK8yoc4+97W5AwYo5xk3Zxon2tg8fdthtYNXUdVlStocWBc3mwJLwCl9+eRWd/O0SMuJCF4WVYO22TY3zP482oa70KN/SbKRxvOIgSOnnWTlrkmFfgL8K/E+fj/JvTwnuO+knVpHPTCTocetMJbt4/Exdwn6KvSLHK2MOs/sN9bk5lfhWK/CUQIc2y+yhax43nevMwOf9niJBGyOvu58Klfwp9SkRII6SrvwOJgTg3pzxvEkRII6TXSCDOWa5t7CVfhFSle4/RzY37PQGIkEpI0khy4z5dXHZJJcQgaW5c1zwQ8UO1EH+YwuwrXsFWtZtOmlRC/J5cbtwEv06xkUpIcAy/72GYAxAhjRCf7qONoHxuTl+6ByKkEVIRmkLnkBxuTnO8CSKkEVJNW4oiIvFXwhxphPxd/j833plqR7T3HURIIaS6eDZ+KviVm/Pk40PatedXsjajXoiXri7rq7cJ8269uwI3jGohOfTtde+fRxEWdMJaet7QJ+QB3DDiXXcRQW8QhbRL7oSH/uWSQCmqx9VgaeVKjM+dABHHGg653gDPOiEbZu7ABuzAcFHXeg332m66zpf6bfdF11Pse7JlSNdIK+RmyyVsvLcahiV+f/mWrBsymdBBa42H0du4EDlFJ9JmfA/DJiQ20EVL40bHeM+XnTX7ix9enhss+hqfSqcGm8qdyQ9oTkTQGHuJplgD/T2Z0b2HbfdfBuzdf/UVIoMSwqCEMCghDEoIgxLCoIQwKCEMSgiDEsKghDB4QYhBN8VTUEDXNeszRHR3nfb4ZSEAAAAASUVORK5CYII='

function formatCurrency(n) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(iso) {
  const d = iso ? new Date(iso) : new Date()
  return d.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }) + ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Generate a professional PDF receipt for a wire / local transfer.
 * @param {Object} txn - transaction data
 * @param {'international'|'local'} txn.type
 * @param {string} txn.ref
 * @param {string} txn.beneficiary
 * @param {number} txn.amount
 * @param {number} [txn.balanceAfter]
 * @param {string} txn.date - ISO date string
 * @param {string} [txn.iban]
 * @param {string} [txn.swift]
 * @param {string} [txn.bankName]
 * @param {string} [txn.country]
 * @param {string} [txn.accountNumber] - for local transfers
 */
export function generateTransferPDF(txn) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 20
  const contentW = pageW - margin * 2
  const isIntl = txn.type === 'international'

  // ── Centered watermark logo (faint, behind content) ────
  const logoW = 60
  const logoH = 53  // maintain 68:60 aspect ratio
  const logoX = (pageW - logoW) / 2
  const logoY = (pageH - logoH) / 2
  doc.saveGraphicsState()
  doc.setGState(new doc.GState({ opacity: 0.06 }))
  doc.addImage(TD_LOGO_B64, 'PNG', logoX, logoY, logoW, logoH)
  doc.restoreGraphicsState()

  // ── Green header bar ──────────────────────────────────
  doc.setFillColor(...TD_GREEN)
  doc.rect(0, 0, pageW, 38, 'F')

  // Bank name (since we can't embed the raster logo cleanly, use bold text)
  doc.setTextColor(...WHITE)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.text('TD', margin, 18)
  doc.setFontSize(10)
  doc.text('Bank', margin + 14, 18)

  // Title
  const title = isIntl ? 'International Wire Confirmation' : 'Local Transfer Confirmation'
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(title, pageW - margin, 16, { align: 'right' })

  // Sub-line
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('TD Bank, N.A.  |  SWIFT: TDOMUS33  |  Member FDIC', pageW - margin, 23, { align: 'right' })

  // Date line under header
  doc.setFontSize(8)
  doc.text(formatDate(txn.date), pageW - margin, 30, { align: 'right' })

  // ── Reference chip ────────────────────────────────────
  let y = 50

  doc.setFillColor(245, 247, 250)
  doc.roundedRect(margin, y - 6, contentW, 16, 3, 3, 'F')
  doc.setFontSize(8)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text('Transaction Reference', margin + 6, y + 1)
  doc.setFontSize(11)
  doc.setTextColor(...DARK)
  doc.setFont('helvetica', 'bold')
  doc.text(txn.ref, pageW - margin - 6, y + 1, { align: 'right' })

  // ── Section: Transfer Details ─────────────────────────
  y += 26

  doc.setFillColor(...TD_GREEN)
  doc.rect(margin, y, 3, 8, 'F')
  doc.setFontSize(11)
  doc.setTextColor(...TD_GREEN)
  doc.setFont('helvetica', 'bold')
  doc.text('Transfer Details', margin + 7, y + 6)

  y += 16

  // Table rows helper
  const drawRow = (label, value, opts = {}) => {
    // Alternating bg
    if (opts.bg) {
      doc.setFillColor(250, 251, 252)
      doc.rect(margin, y - 4.5, contentW, 11, 'F')
    }
    // Separator
    doc.setDrawColor(...LIGHT_GRAY)
    doc.setLineWidth(0.2)
    doc.line(margin, y + 6.5, pageW - margin, y + 6.5)

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...GRAY)
    doc.text(label, margin + 4, y + 2)

    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text(String(value), pageW - margin - 4, y + 2, { align: 'right' })
    y += 11
  }

  drawRow('Beneficiary Name', txn.beneficiary, { bg: true })

  // Transaction Category
  const category = txn.category || (isIntl ? 'International Wire Transfer' : 'Local Transfer')
  drawRow('Transaction Category', category)

  if (isIntl) {
    drawRow('IBAN / Account No.', txn.iban || '—', { bg: true })
    drawRow('SWIFT / BIC Code', txn.swift || '—')
    drawRow('Bank Name', txn.bankName || '—', { bg: true })
    drawRow('Country', txn.country || '—')
  } else {
    drawRow('Account Number', txn.accountNumber || '—', { bg: true })
    drawRow('Bank Name', txn.bankName || '—')
  }

  drawRow('Transfer Amount', `$${formatCurrency(txn.amount)}`, { bg: true })

  // ── Status badge ──────────────────────────────────────
  y += 6
  doc.setFillColor(236, 253, 245)
  doc.roundedRect(margin, y - 4, 52, 12, 3, 3, 'F')
  doc.setFontSize(9)
  doc.setTextColor(22, 163, 74)
  doc.setFont('helvetica', 'bold')
  doc.text('● Status: Completed', margin + 5, y + 3)

  // Timestamp
  doc.setFontSize(7.5)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text(`Processed: ${formatDate(txn.date)}`, pageW - margin, y + 3, { align: 'right' })

  // ── Divider ───────────────────────────────────────────
  y += 20
  doc.setDrawColor(...LIGHT_GRAY)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageW - margin, y)

  // ── Important Notice (international only) ──────────────
  if (isIntl) {
    y += 10
    doc.setFillColor(255, 251, 235)
    doc.roundedRect(margin, y - 4, contentW, 20, 3, 3, 'F')
    doc.setFontSize(8)
    doc.setTextColor(161, 98, 7)
    doc.setFont('helvetica', 'bold')
    doc.text('Important Notice', margin + 6, y + 2)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.text(
      'International wire transfers may take 1-3 business days to process. Fees may apply based on your account type.',
      margin + 6, y + 9,
      { maxWidth: contentW - 12 }
    )
  }

  // ── Footer ────────────────────────────────────────────
  const footerY = pageH - 28

  // Green line
  doc.setDrawColor(...TD_GREEN)
  doc.setLineWidth(0.6)
  doc.line(margin, footerY, pageW - margin, footerY)

  // Footer text
  doc.setFontSize(7)
  doc.setTextColor(...GRAY)
  doc.setFont('helvetica', 'normal')
  doc.text(
    'This is a computer-generated document and requires no signature.',
    pageW / 2, footerY + 6,
    { align: 'center' }
  )
  doc.text(
    'TD Bank, N.A.  |  Member FDIC  |  Equal Housing Lender',
    pageW / 2, footerY + 11,
    { align: 'center' }
  )
  doc.text(
    `© ${new Date().getFullYear()} TD Bank. All rights reserved.  |  For questions call 1-888-751-9000`,
    pageW / 2, footerY + 16,
    { align: 'center' }
  )

  // ── Save ──────────────────────────────────────────────
  const filename = `TD_Bank_${isIntl ? 'Wire' : 'Transfer'}_${txn.ref}.pdf`
  doc.save(filename)
}
