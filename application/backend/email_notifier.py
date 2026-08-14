import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any, List, Optional

logger = logging.getLogger("email_notifier")

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com").strip()
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()
SMTP_FROM = os.getenv("SMTP_FROM", "alerts@cloud-detective.com").strip()


def send_email_notification(
    to_email: str,
    subject: str,
    resource_group: str,
    issues: List[Dict[str, Any]],
    total_savings: str
) -> bool:
    """
    Sends an automated FinOps Cost Alert email to the target recipient.
    Supports real SMTP dispatch when credentials are set, with standard fallback logging.
    """
    if not to_email or "@" not in to_email:
        logger.warning(f"Invalid alert email recipient: '{to_email}'")
        return False

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 16px; padding: 24px; border: 1px solid #334155; }}
            .header {{ border-b: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }}
            .title {{ font-size: 20px; font-weight: bold; color: #818cf8; margin: 0; }}
            .badge {{ background: #312e81; color: #c7d2fe; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: bold; }}
            .metrics {{ background: #090d16; padding: 16px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }}
            .savings {{ color: #34d399; font-size: 22px; font-weight: bold; }}
            .issue-card {{ background: #0f172a; border-left: 4px solid #f43f5e; padding: 12px 16px; border-radius: 8px; margin-bottom: 12px; }}
            .cmd {{ background: #020617; color: #e2e8f0; font-family: monospace; padding: 8px; border-radius: 6px; font-size: 12px; margin-top: 6px; word-break: break-all; }}
            .footer {{ text-align: center; color: #64748b; font-size: 12px; margin-top: 24px; border-top: 1px solid #334155; padding-top: 16px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 class="title">🚨 AI FinOps Cost Alert Report</h2>
                <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Resource Group: <span class="badge">{resource_group}</span></p>
            </div>

            <div class="metrics">
                <div>
                    <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase;">Est. Monthly Savings Rate</div>
                    <div class="savings">{total_savings}</div>
                </div>
                <div style="text-align: right;">
                    <div style="color: #94a3b8; font-size: 11px; text-transform: uppercase;">Issues Detected</div>
                    <div style="color: #f43f5e; font-size: 22px; font-weight: bold;">{len(issues)}</div>
                </div>
            </div>

            <h3 style="color: #f8fafc; font-size: 15px; margin-bottom: 12px;">Detected Inefficiencies & Fix Commands:</h3>
    """

    for idx, issue in enumerate(issues, 1):
        title = issue.get("title", f"Issue #{idx}")
        sev = issue.get("severity", "Medium").upper()
        res_name = issue.get("affected_resource", "N/A")
        desc = issue.get("description", "")
        fix_cmd = issue.get("fix_command", "")
        savings = issue.get("estimated_savings", "$0.00")

        html_content += f"""
            <div class="issue-card">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong style="color: #ffffff; font-size: 14px;">{idx}. {title}</strong>
                    <span style="color: #fbbf24; font-size: 11px; font-weight: bold;">[{sev}] ({savings})</span>
                </div>
                <p style="color: #cbd5e1; font-size: 12px; margin: 6px 0;">Affected Resource: <code style="color: #818cf8;">{res_name}</code></p>
                <p style="color: #94a3b8; font-size: 12px; margin: 4px 0;">{desc}</p>
                {f'<div class="cmd">CLI Fix: {fix_cmd}</div>' if fix_cmd else ''}
            </div>
        """

    html_content += """
            <div class="footer">
                <p>AI Cloud Cost Detective &copy; 2026. Automated FinOps Governance System.</p>
            </div>
        </div>
    </body>
    </html>
    """

    # If SMTP credentials are missing, perform simulated dispatch
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.info(f"========== [SIMULATED EMAIL DISPATCH] ==========")
        logger.info(f"To: {to_email}")
        logger.info(f"Subject: {subject}")
        logger.info(f"Resource Group: {resource_group} | Savings: {total_savings} | Issues: {len(issues)}")
        logger.info(f"Notice: Set SMTP_USER and SMTP_PASSWORD in .env for real SMTP inbox delivery.")
        logger.info(f"==================================================")
        return True

    # Real SMTP Dispatch
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = SMTP_FROM or SMTP_USER
        msg["To"] = to_email

        msg.attach(MIMEText(html_content, "html"))

        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(msg["From"], [to_email], msg.as_string())
        server.quit()

        logger.info(f"Successfully sent alert email to {to_email} via SMTP ({SMTP_HOST})!")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via SMTP: {str(e)}")
        return False
