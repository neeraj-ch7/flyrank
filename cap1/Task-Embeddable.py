from pathlib import Path
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib import colors
from reportlab.lib.units import mm

out = Path("/mnt/data/Lead_Capture_Platform_Capstone_Submission.pdf")

styles = getSampleStyleSheet()
title = ParagraphStyle("T", parent=styles["Title"], alignment=TA_CENTER, fontSize=19, leading=23, spaceAfter=6)
sub = ParagraphStyle("S", parent=styles["Normal"], alignment=TA_CENTER, fontSize=9.5, textColor=colors.grey, spaceAfter=15)
h = ParagraphStyle("H", parent=styles["Heading1"], fontSize=13, leading=16, spaceBefore=10, spaceAfter=6)
body = ParagraphStyle("B", parent=styles["BodyText"], fontSize=9.7, leading=14, spaceAfter=6)
small = ParagraphStyle("SM", parent=body, fontSize=8.5, leading=11.5)
bullet = ParagraphStyle("BL", parent=body, leftIndent=13, firstLineIndent=-7, spaceAfter=3)

story = [
    Paragraph("Embeddable Widget & Lead-Capture Platform", title),
    Paragraph("FlyRank Internship · Backend Development Track · Capstone", sub),

    Paragraph("1. The Mission", h),
    Paragraph(
        "Build a platform that lets customers create embeddable widgets such as signup forms, contact forms, "
        "and call-to-action popovers, then install them on any website using a single script tag. Visitor submissions "
        "are sent to the backend for validation, abuse protection, location enrichment, storage, and dashboard visibility.",
        body),

    Paragraph("2. Architecture Overview", h),
    Paragraph(
        "<b>Widget Owner</b> → Authenticated Widget Management API → Widget DB → Embed Snippet<br/>"
        "<b>Customer Website</b> → widget.js → Public Cached Config → Render Widget<br/>"
        "<b>Website Visitor</b> → Public Submission API → Validation → Rate Limit + Spam Check → "
        "Geo Provider A → Provider B fallback → Store → Email/Webhook<br/>"
        "<b>Widget Owner</b> → Dashboard API → Submissions + Statistics",
        body),

    Paragraph("3. Core Requirements", h),
]
req = [
    ("Widget management", "Authenticated CRUD; valid authentication required; tenant isolation for widgets and submissions."),
    ("Widget delivery", "Generate an embed snippet, serve public configuration with Cache-Control max-age, and serve a versioned widget bundle."),
    ("Public submission API", "Support cross-origin requests and OPTIONS preflight; validate all input and reject malformed/oversized payloads with 4xx JSON errors."),
    ("Abuse protection", "Rate limiting per IP and/or widget with 429 responses, plus at least one spam-prevention method."),
    ("Enrichment & side effects", "IP geolocation uses provider A then provider B; if all providers fail, submission still succeeds. Email/webhook failure must not block storage."),
    ("Dashboard API", "Owner can view submissions and basic analytics including counts over time, per-widget statistics, and geo breakdown."),
    ("Documentation", "README, architecture diagram, setup instructions, API documentation, and required capstone files."),
]
table = Table([[Paragraph("<b>Requirement</b>", small), Paragraph("<b>What must be demonstrated</b>", small)]] +
              [[Paragraph(a, small), Paragraph(b, small)] for a,b in req],
              colWidths=[43*mm, 127*mm], repeatRows=1)
table.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,0),colors.lightgrey),
    ("GRID",(0,0),(-1,-1),0.4,colors.grey),
    ("VALIGN",(0,0),(-1,-1),"TOP"),
    ("LEFTPADDING",(0,0),(-1,-1),5), ("RIGHTPADDING",(0,0),(-1,-1),5),
    ("TOPPADDING",(0,0),(-1,-1),4), ("BOTTOMPADDING",(0,0),(-1,-1),4),
]))
story.append(table)

story += [
    Paragraph("4. Build Plan", h),
    Paragraph(
        "<b>Phase 1 — Design:</b> Define widget and submission models, tenancy, indexes, API contracts, request paths, "
        "and one explicit non-goal. Gate: the one-page design document is committed.<br/><br/>"
        "<b>Phase 2 — Hardened Submission Path:</b> Implement public submission validation, CORS, rate limiting, spam "
        "control, geo fallback, and safe side effects. Gate: a cross-origin request stores an enriched row.<br/><br/>"
        "<b>Phase 3 — Delivery, Dashboard & Proof:</b> Implement widget script, cached/versioned delivery, second-origin "
        "test page, dashboard endpoints, README, and EVIDENCE.md. Gate: widget renders on a second-origin page.",
        body),

    Paragraph("5. Technology Stack", h),
    Paragraph(
        "<b>Language/Framework:</b> Node.js + Express or Python + FastAPI<br/>"
        "<b>Database:</b> PostgreSQL via Docker (SQLite can be used to start)<br/>"
        "<b>Geo APIs:</b> ip-api.com and ipapi.co as fallback<br/>"
        "<b>Email:</b> Console logging or Mailpit<br/>"
        "<b>Customer Test Page:</b> Plain HTML from a different origin<br/>"
        "<b>Repository:</b> Public GitHub<br/>"
        "<b>Cost:</b> $0; no credit card required",
        body),

    Paragraph("6. Evidence & Evaluation Plan", h),
    Paragraph(
        "The submission evidence will demonstrate the evaluator's acceptance probes: a valid cross-origin submission is "
        "stored and visible through the dashboard; malformed and oversized payloads return clean 4xx responses; rapid "
        "bursts trigger 429 while legitimate traffic continues; geo provider A failure falls back to provider B; both "
        "providers failing still allow storage; failing email/webhook side effects do not prevent success; and a filled "
        "honeypot/spam control blocks a bot-like submission.",
        body),

    Paragraph("7. Required Repository Files", h),
]
for x in [
    "<b>README.md</b> — what the system does, architecture diagram, exact run/seed steps, API documentation, limitations.",
    "<b>capstone.yaml</b> — run command, seed command, optional test command, base URL, and endpoints.",
    "<b>EVIDENCE.md</b> — one concrete proof per requirement checkbox.",
    "<b>BUILDLOG.md</b> — honest AI-usage log: where AI helped, where it was wrong, and what was changed.",
    "<b>.env.example</b> — required environment variables with safe placeholders.",
    "<b>.gitignore</b> — exclude secrets, node_modules/virtualenvs, and other generated files.",
    "<b>LICENSE</b> — an appropriate open-source license such as MIT.",
]:
    story.append(Paragraph("• " + x, bullet))

story += [
    Paragraph("8. Core Engineering Principles", h),
    Paragraph(
        "The implementation will keep data, business logic, and HTTP handling separated through layered architecture. "
        "Input will be validated at the boundary before business logic. The project will include at least one background "
        "job for slow or bulk work, real persistence with migrations and indexes, idempotency where it matters, "
        "environment-based secrets, and AI cost tracking with a budget guard if AI services are used.",
        body),

    Paragraph("9. Scope & Non-Goals", h),
    Paragraph(
        "The core will be prioritized over visual polish. The customer site may be a plain HTML page on another local "
        "origin, the widget UI can remain minimal, and email can be simulated locally. Stretch goals will only be attempted "
        "after every core requirement is complete.",
        body),

    Paragraph("10. Final Submission Checklist", h),
]
for x in [
    "Dedicated public GitHub repository created for the capstone.",
    "Core requirements implemented and individually evidenced.",
    "README, capstone.yaml, EVIDENCE.md, BUILDLOG.md, and .env.example committed.",
    "No secrets, API keys, passwords, node_modules, virtual environments, or large unnecessary datasets committed.",
    "Main branch remains runnable with the documented command and seed step.",
    "Final public GitHub repository link is pasted into the FlyRank submission portal.",
]:
    story.append(Paragraph("☐ " + x, bullet))

story.append(Spacer(1, 8))
story.append(Paragraph(
    "Reference: FlyRank Internship · Backend Track · Capstone — Embeddable Widget & Lead-Capture Platform. "
    "This document is structured as a submission-ready capstone plan based on the supplied capstone brief.",
    small))

doc = SimpleDocTemplate(str(out), pagesize=A4, rightMargin=18*mm, leftMargin=18*mm, topMargin=16*mm, bottomMargin=16*mm)
doc.build(story)
print(out)
