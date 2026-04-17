import "./AppointmentMessagePane.css";
import type { AppointmentActivityEntry } from "../appointmentTypes";

type Props = {
  selectedTemplate: string;
  templateOptions: string[];
  draftEmail: string;
  selectedSmsTemplate: string;
  smsTemplateOptions: string[];
  draftSms: string;
  callAttempts: string[];
  activityLog: AppointmentActivityEntry[];
  onTemplateChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSendEmail: () => void;
  onSmsTemplateChange: (value: string) => void;
  onSmsChange: (value: string) => void;
  onSendSms: () => void;
};

function formatActivityClass(type: AppointmentActivityEntry["type"]) {
  return type.toLowerCase();
}

export default function AppointmentMessagePane({
  selectedTemplate,
  templateOptions,
  draftEmail,
  selectedSmsTemplate,
  smsTemplateOptions,
  draftSms,
  callAttempts,
  activityLog,
  onTemplateChange,
  onEmailChange,
  onSendEmail,
  onSmsTemplateChange,
  onSmsChange,
  onSendSms,
}: Props) {
  return (
    <aside className="ms-appointment-message-pane">
      <div className="ms-appointment-message-pane__scroll">
        <section className="ms-appointment-message-pane__card">
          <h3>Emails</h3>
          <select
            className="ms-appointment-message-pane__select"
            value={selectedTemplate}
            onChange={(e) => onTemplateChange(e.target.value)}
          >
            {templateOptions.map((template) => (
              <option key={template} value={template}>
                {template}
              </option>
            ))}
          </select>
          <textarea
            className="ms-appointment-message-pane__textarea"
            value={draftEmail}
            onChange={(e) => onEmailChange(e.target.value)}
          />
          <button
            type="button"
            className="ms-appointment-message-pane__button"
            onClick={onSendEmail}
          >
            Send Email
          </button>
        </section>

        <section className="ms-appointment-message-pane__card">
          <h3>SMS</h3>
          <select
            className="ms-appointment-message-pane__select"
            value={selectedSmsTemplate}
            onChange={(e) => onSmsTemplateChange(e.target.value)}
          >
            {smsTemplateOptions.map((template) => (
              <option key={template} value={template}>
                {template}
              </option>
            ))}
          </select>
          <textarea
            className="ms-appointment-message-pane__textarea ms-appointment-message-pane__textarea--small"
            value={draftSms}
            onChange={(e) => onSmsChange(e.target.value)}
          />
          <button
            type="button"
            className="ms-appointment-message-pane__button"
            onClick={onSendSms}
          >
            Send SMS
          </button>
        </section>

        <section className="ms-appointment-message-pane__card">
          <h3>Call Attempt Logs</h3>
          <div className="ms-appointment-message-pane__log-list">
            {callAttempts.map((entry, index) => (
              <div key={`${entry}-${index}`} className="ms-appointment-message-pane__log-item">
                {entry}
              </div>
            ))}
          </div>
        </section>

        <section className="ms-appointment-message-pane__card">
          <h3>Activity Tracking</h3>
          <div className="ms-appointment-message-pane__log-list ms-appointment-message-pane__log-list--activity">
            {activityLog.map((entry, index) => (
              <div key={`${entry.timestamp}-${index}`} className="ms-appointment-message-pane__log-item">
                <div className="ms-appointment-message-pane__activity-top">
                  <span className={`ms-appointment-message-pane__tag ms-appointment-message-pane__tag--${formatActivityClass(entry.type)}`}>
                    {entry.type}
                  </span>
                  <span className="ms-appointment-message-pane__time">{entry.timestamp}</span>
                </div>
                <div className="ms-appointment-message-pane__message">{entry.message}</div>
                <div className="ms-appointment-message-pane__meta">{entry.user} • {entry.role}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </aside>
  );
}
