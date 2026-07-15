import { PageHeader } from "@/components/shell/PageHeader";
import { CalendarClient } from "@/components/views/CalendarClient";

export default function CalendarPage() {
  return (
    <div>
      <PageHeader title="Calendar" subtitle="Launch milestones and task dues" />
      <CalendarClient />
    </div>
  );
}
