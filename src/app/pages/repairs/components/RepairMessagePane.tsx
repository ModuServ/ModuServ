import "./RepairMessagePane.css";
import {
  ClipboardCheck,
  Mail,
  MessageSquare,
  MessageSquareText,
  Phone,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { WorkflowWorkflowActivityEntry } from "../workflowTypes";

type Props = {
  selectedTemplate: string;
  templateOptions: string[];
  draftEmail: string;
  selectedSmsTemplate: string;
  smsTemplateOptions: string[];
  draftSms: string;
  callLog: string;
  callAttempts: string[];
  activityLog: WorkflowWorkflowActivityEntry[];
  onTemplateChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onSendEmail: () => void;
  onSmsTemplateChange: (value: string) => void;
  onSmsChange: (value: string) => void;
  onSendSms: () => void;
  onCallLogChange: (value: string) => void;
  onAddCallLog: () => void;
};

type ActivityFilter =
  | "ALL"
  | "EMAIL"
  | "SMS"
  | "STATUS"
  | "NOTE"
  | "POST_REPAIR"
  | "CALL"
  | "SYSTEM";

function formatActivityTypeLabel(type: WorkflowWorkflowActivityEntry["type"]) {
  switch (type) {
    case "EMAIL":
      return "Email";
    case "SMS":
      return "SMS";
    case "STATUS":
      return "Status";
    case "NOTE":
      return "Note";
    case "POST_REPAIR":
      return "Post-Repair";
    case "CALL":
      return "Call";
    default:
      return "System";
  }
}

function formatActivityTypeClass(type: WorkflowWorkflowActivityEntry["type"]) {
  return type.toLowerCase().replace("_", "-");
}

export default function RepairMessagePane({
  selectedTemplate,
  templateOptions,
  draftEmail,
  selectedSmsTemplate,
  smsTemplateOptions,
  draftSms,
  callLog,
  callAttempts,
  activityLog,
  onTemplateChange,
  onEmailChange,
  onSendEmail,
  onSmsTemplateChange,
  onSmsChange,
  onSendSms,
  onCallLogChange,
  onAddCallLog,
}: Props) {
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("ALL");

  const filteredActivity = useMemo(() => {
    if (activityFilter === "ALL") {
      return activityLog;
    }

    return activityLog.filter((entry) => entry.type === activityFilter);
  }, [activityLog, activityFilter]);

  return (
    <aside className="ms-repair-message-pane">
      <div className="ms-repair-message-pane__scroll">
        <section className="ms-repair-message-pane__card">
          <div className="ms-repair-message-pane__head">
            <Mail size={16} />
            <h3>Emails</h3>
          </div>

          <textarea
            className="ms-repair-message-pane__textarea"
            value={draftEmail}
            onChange={(e) => onEmailChange(e.target.value)}
          />

          <button type="button" className="ms-repair-message-pane__button" onClick={onSendEmail}>
            Send Email
          </button>
        </section>

        <section className="ms-repair-message-pane__card">
          <div className="ms-repair-message-pane__head">
            <MessageSquareText size={16} />
            <h3>Message Templates</h3>
          </div>

          <select
            className="ms-repair-message-pane__select"
            value={selectedTemplate}
            onChange={(e) => onTemplateChange(e.target.value)}
          >
            {templateOptions.map((template) => (
              <option key={template} value={template}>
                {template}
              </option>
            ))}
          </select>
        </section>

        <section className="ms-repair-message-pane__card">
          <div className="ms-repair-message-pane__head">
            <MessageSquare size={16} />
            <h3>SMS</h3>
          </div>

          <select
            className="ms-repair-message-pane__select"
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
            className="ms-repair-message-pane__textarea ms-repair-message-pane__textarea--small"
            value={draftSms}
            onChange={(e) => onSmsChange(e.target.value)}
          />

          <button type="button" className="ms-repair-message-pane__button" onClick={onSendSms}>
            Send SMS
          </button>
        </section>

        <section className="ms-repair-message-pane__card">
          <div className="ms-repair-message-pane__head">
            <Phone size={16} />
            <h3>Call Attempt Logs</h3>
          </div>

          <textarea
            className="ms-repair-message-pane__textarea ms-repair-message-pane__textarea--small"
            placeholder="Log latest call attempt..."
            value={callLog}
            onChange={(e) => onCallLogChange(e.target.value)}
          />

          <button
            type="button"
            className="ms-repair-message-pane__button ms-repair-message-pane__button--secondary"
            onClick={onAddCallLog}
          >
            Add Call Log
          </button>

          <div className="ms-repair-message-pane__log-list">
            {callAttempts.map((entry, index) => (
              <div key={`${entry}-${index}`} className="ms-repair-message-pane__log-item">
                {entry}
              </div>
            ))}
          </div>
        </section>

        <section className="ms-repair-message-pane__card">
          <div className="ms-repair-message-pane__head ms-repair-message-pane__head--between">
            <div className="ms-repair-message-pane__head-inline">
              <ClipboardCheck size={16} />
              <h3>Activity Tracking</h3>
            </div>

            <select
              className="ms-repair-message-pane__filter-select"
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value as ActivityFilter)}
            >
              <option value="ALL">All Activity</option>
              <option value="EMAIL">Email</option>
              <option value="SMS">SMS</option>
              <option value="STATUS">Status</option>
              <option value="NOTE">Note</option>
              <option value="POST_REPAIR">Post-Repair</option>
              <option value="CALL">Call</option>
              <option value="SYSTEM">System</option>
            </select>
          </div>

          <div className="ms-repair-message-pane__log-list ms-repair-message-pane__log-list--activity">
            {filteredActivity.length > 0 ? (
              filteredActivity.map((entry, index) => (
                <div
                  key={`${entry.timestamp}-${entry.type}-${index}`}
                  className="ms-repair-message-pane__log-item"
                >
                  <div className="ms-repair-message-pane__activity-top">
                    <span
                      className={`ms-repair-message-pane__activity-tag ms-repair-message-pane__activity-tag--${formatActivityTypeClass(
                        entry.type
                      )}`}
                    >
                      {formatActivityTypeLabel(entry.type)}
                    </span>
                    <span className="ms-repair-message-pane__activity-time">{entry.timestamp}</span>
                  </div>

                  <div className="ms-repair-message-pane__activity-message">{entry.message}</div>

                  <div className="ms-repair-message-pane__activity-meta">
                    {entry.user} &bull; {entry.role}
                  </div>
                </div>
              ))
            ) : (
              <div className="ms-repair-message-pane__empty-activity">
                No activity entries match this filter.
              </div>
            )}
          </div>
        </section>
      </div>
    </aside>
  );
}
