import { GlobalSearch } from "@/components/shell/GlobalSearch";
import { NewClientButton } from "@/components/views/NewClientButton";
import { CreateTaskForm } from "@/components/views/CreateTaskForm";
import { canWrite } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";

export async function PageHeader({
  title,
  subtitle,
  actions,
  showNewClient = true,
  showNewTask = false,
  clientOptions = [],
  defaultClientId,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  showNewClient?: boolean;
  showNewTask?: boolean;
  clientOptions?: { id: number; name: string }[];
  defaultClientId?: number;
}) {
  const user = await getSessionUser();
  const writable = user ? canWrite(user) : false;

  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[24px] font-semibold tracking-tight text-vco-ink sm:text-[28px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-sm text-vco-muted">{subtitle}</p>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <GlobalSearch />
        {actions}
        {showNewTask && writable ? (
          <CreateTaskForm
            clientId={defaultClientId}
            clientOptions={clientOptions}
          />
        ) : null}
        {showNewClient && writable ? <NewClientButton /> : null}
      </div>
    </div>
  );
}
