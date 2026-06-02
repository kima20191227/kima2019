import nodemailer from 'nodemailer'

const SITE_URL = process.env.NEXTAUTH_URL ?? 'https://kima2019.org'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'kima20191227@gmail.com'

function cleanHeaderValue(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim()
}

function cleanEmailAddress(value: string | undefined): string {
  return (value ?? '').replace(/[\r\n<>]+/g, '').trim()
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

export async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.SMTP_PASSWORD) return

  const transporter = createTransporter()
  await transporter.sendMail({
    from: { name: 'KIMA 한국이주민선교연합회', address: cleanEmailAddress(process.env.SMTP_USER) || ADMIN_EMAIL },
    to: cleanEmailAddress(to),
    subject: cleanHeaderValue(subject),
    html,
  })
}

// ─── 공통 레이아웃 ────────────────────────────────────────
function layout(body: string) {
  return `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8F9FA;font-family:'Noto Sans KR',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8F9FA;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- 헤더 -->
        <tr><td style="background:#1B3A6B;padding:24px 32px;text-align:center;">
          <p style="margin:0;color:#C8922A;font-size:12px;letter-spacing:2px;font-weight:600;">KIMA</p>
          <h1 style="margin:4px 0 0;color:#ffffff;font-size:20px;font-weight:700;">한국이주민선교연합회</h1>
        </td></tr>
        <!-- 본문 -->
        <tr><td style="padding:40px 32px;color:#1A1A1A;line-height:1.7;font-size:15px;">
          ${body}
        </td></tr>
        <!-- 푸터 -->
        <tr><td style="background:#F8F9FA;padding:20px 32px;text-align:center;color:#888;font-size:12px;border-top:1px solid #eee;">
          <p style="margin:0;">문의: <a href="mailto:${ADMIN_EMAIL}" style="color:#1B3A6B;">${ADMIN_EMAIL}</a></p>
          <p style="margin:6px 0 0;">© 한국이주민선교연합회 | <a href="${SITE_URL}" style="color:#1B3A6B;">kima2019.org</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function btn(text: string, url: string) {
  return `<div style="margin:32px 0;text-align:center;">
    <a href="${url}" style="background:#C8922A;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;display:inline-block;">
      ${text}
    </a>
  </div>`
}

// ─── 템플릿 ──────────────────────────────────────────────

/** 가입 환영 */
export function welcomeEmailHtml(name: string) {
  return layout(`
    <h2 style="color:#1B3A6B;margin-top:0;">환영합니다, ${name}님! 🎉</h2>
    <p>KIMA 한국이주민선교연합회 회원이 되신 것을 진심으로 환영합니다.</p>
    <p>일반회원으로 커뮤니티, 단체 디렉토리 등 다양한 기능을 이용하실 수 있습니다.</p>
    <p>연 회비 5만원 납부 후 <strong>정회원</strong>으로 승급하시면 전문 자료실과 정회원 전용 콘텐츠에 접근할 수 있습니다.</p>
    ${btn('KIMA 방문하기', SITE_URL)}
    <p style="color:#888;font-size:13px;margin-top:32px;">
      정회원 신청 안내: <a href="${SITE_URL}/member/upgrade" style="color:#1B3A6B;">${SITE_URL}/member/upgrade</a>
    </p>
  `)
}

/** 정회원 승인 */
export function premiumApprovedEmailHtml(name: string) {
  return layout(`
    <h2 style="color:#1B3A6B;margin-top:0;">정회원 승인이 완료되었습니다 ✅</h2>
    <p>${name}님의 정회원 가입이 승인되었습니다. 감사합니다!</p>
    <p>이제 아래 콘텐츠를 이용하실 수 있습니다:</p>
    <ul style="padding-left:20px;line-height:2;">
      <li>📄 자료실 정회원 전용 자료 (비자·법률, 의료·복지, 보조금·공모, 선교·훈련)</li>
      <li>💬 정회원 전용 커뮤니티 게시판</li>
      <li>🎙 리스닝콜·포럼 우선 신청</li>
    </ul>
    ${btn('자료실 바로가기', `${SITE_URL}/resources`)}
    <p style="color:#888;font-size:13px;">정회원 자격은 승인일로부터 1년간 유효합니다. 갱신 안내는 만료 30일 전에 별도 발송됩니다.</p>
  `)
}

/** 정회원 만료 D-30 */
export function premiumExpiringEmailHtml(name: string, expiresAt: Date) {
  const formatted = expiresAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
  return layout(`
    <h2 style="color:#1B3A6B;margin-top:0;">정회원 갱신 안내</h2>
    <p>${name}님의 정회원 자격이 <strong>${formatted}</strong>에 만료될 예정입니다.</p>
    <p>정회원 자격을 유지하시려면 만료 전에 연 회비를 납부해 주세요.</p>
    <div style="background:#FFF8E1;border:1px solid #FFD54F;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;font-weight:600;">입금 계좌</p>
      <p style="margin:8px 0 0;font-size:18px;font-weight:700;color:#1B3A6B;">하나은행 435-910079-52904</p>
      <p style="margin:4px 0 0;color:#666;font-size:13px;">예금주: 한국이주민선교연합회 | 연 5만원</p>
    </div>
    <p>납부 후 성함·금액·납부일을 <a href="mailto:${ADMIN_EMAIL}" style="color:#1B3A6B;">${ADMIN_EMAIL}</a>으로 알려주세요.</p>
    ${btn('정회원 갱신 안내 페이지', `${SITE_URL}/member/upgrade`)}
  `)
}

/** 단체 등록 승인 */
export function organizationApprovedEmailHtml(orgName: string) {
  return layout(`
    <h2 style="color:#1B3A6B;margin-top:0;">단체 등록이 완료되었습니다 🏢</h2>
    <p><strong>${orgName}</strong>이(가) KIMA 회원단체 디렉토리에 등재되었습니다.</p>
    <p>이제 전국 이주민 사역 단체 지도와 목록에서 귀 단체를 확인하실 수 있습니다.</p>
    ${btn('단체 디렉토리 확인하기', `${SITE_URL}/directory`)}
    <p style="color:#888;font-size:13px;">단체 정보 수정이 필요하시면 <a href="mailto:${ADMIN_EMAIL}" style="color:#1B3A6B;">${ADMIN_EMAIL}</a>으로 연락해 주세요.</p>
  `)
}

/** 행사 참석 신청 완료 */
export function eventRegisteredEmailHtml(eventTitle: string, scheduledAt: Date, zoomUrl?: string | null) {
  const dateStr = scheduledAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })
  return layout(`
    <h2 style="color:#1B3A6B;margin-top:0;">참석 신청이 완료되었습니다 📅</h2>
    <p><strong>${eventTitle}</strong> 참석 신청을 접수하였습니다.</p>
    <div style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;font-size:13px;color:#666;">일시</p>
      <p style="margin:4px 0 0;font-weight:700;font-size:16px;color:#1B3A6B;">${dateStr}</p>
      ${zoomUrl ? `<p style="margin:12px 0 0;font-size:13px;color:#666;">Zoom 링크</p>
      <p style="margin:4px 0 0;"><a href="${zoomUrl}" style="color:#1B3A6B;font-weight:600;">${zoomUrl}</a></p>` : ''}
    </div>
    <p>행사 3일 전에 리마인더 이메일이 발송됩니다.</p>
    ${zoomUrl ? btn('Zoom 참여하기', zoomUrl) : ''}
  `)
}

/** 행사 D-3 리마인더 */
export function eventReminderEmailHtml(eventTitle: string, scheduledAt: Date, zoomUrl?: string | null) {
  const dateStr = scheduledAt.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })
  return layout(`
    <h2 style="color:#1B3A6B;margin-top:0;">[KIMA] 3일 후 일정이 있습니다 🎙</h2>
    <p><strong>${eventTitle}</strong>이 3일 후에 시작됩니다.</p>
    <div style="background:#EEF2FF;border:1px solid #C7D2FE;border-radius:8px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;font-size:13px;color:#666;">일시</p>
      <p style="margin:4px 0 0;font-weight:700;font-size:16px;color:#1B3A6B;">${dateStr}</p>
      ${zoomUrl ? `<p style="margin:12px 0 0;font-size:13px;color:#666;">Zoom 링크</p>
      <p style="margin:4px 0 0;"><a href="${zoomUrl}" style="color:#1B3A6B;font-weight:600;">${zoomUrl}</a></p>` : ''}
    </div>
    <p>참석을 기대합니다. 문의 사항이 있으시면 <a href="mailto:${ADMIN_EMAIL}" style="color:#1B3A6B;">${ADMIN_EMAIL}</a>으로 연락해 주세요.</p>
    ${zoomUrl ? btn('Zoom 참여하기', zoomUrl) : ''}
  `)
}
