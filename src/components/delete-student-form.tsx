"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";

import { deleteStudentAction, type DeleteStudentState } from "@/app/actions/admin";

const initialState: DeleteStudentState = {};

export function DeleteStudentForm({ userId, email }: { userId: string; email: string }) {
  const [state, action, pending] = useActionState(deleteStudentAction, initialState);

  function confirmDeletion(event: React.FormEvent<HTMLFormElement>) {
    if (!window.confirm(`¿Eliminar permanentemente la cuenta ${email} y todo su E-CV? Esta acción no se puede deshacer.`)) {
      event.preventDefault();
    }
  }

  return (
    <div className="delete-student-action">
      <form action={action} onSubmit={confirmDeletion}>
        <input type="hidden" name="userId" value={userId} />
        <button
          className="button button--danger button--small"
          disabled={pending}
          type="submit"
          title="Eliminar cuenta y todos sus snapshots"
        >
          <Trash2 size={14} /> {pending ? "Eliminando…" : "Eliminar"}
        </button>
      </form>
      {state.error && <p className="admin-action-error" role="alert">{state.error}</p>}
    </div>
  );
}
