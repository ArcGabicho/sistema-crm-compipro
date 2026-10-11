"use client";

import { useEffect, useRef, useState } from "react";
import { sileo } from "sileo";
import { LoaderCircle } from "lucide-react";
import { crm } from "@/app/lib/crm";

type CheckIn = {
  registroId: number;
  fecha: string;
  horaProgramada: string;
  horaIngreso: string;
  minutosTardanza: number;
  minutosAnticipacion: number;
  tarde: boolean;
  estado: string;
  yaRegistrada: boolean;
  justificada: boolean;
};

const hhmm = (t: string) => (t ? t.slice(0, 5) : "--:--");

/**
 * Al entrar al panel registra el ingreso del usuario (idempotente por día) y
 * avisa por Sileo. Si llega tarde, abre un modal para justificar la tardanza.
 */
export default function AttendanceGate() {
  const [registro, setRegistro] = useState<CheckIn | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const warnId = useRef<string | null>(null);

  useEffect(() => {
    let cancel = false;
    void (async () => {
      let data: CheckIn;
      try {
        data = await crm.action<CheckIn>("asistencia/check-in");
      } catch {
        return; // el control de asistencia no debe romper el panel
      }
      if (cancel) return;
      setRegistro(data);

      if (data.yaRegistrada) return; // ya se avisó hoy

      if (!data.tarde) {
        if (data.estado === "Temprano") {
          sileo.info({
            title: "Ingreso registrado",
            description: `${hhmm(data.horaIngreso)} · ${data.minutosAnticipacion} min antes de tu hora de entrada (${hhmm(
              data.horaProgramada,
            )})`,
          });
        } else {
          sileo.success({
            title: "Ingreso registrado",
            description: `${hhmm(data.horaIngreso)} · llegaste a tiempo`,
          });
        }
        return;
      }

      warnId.current = sileo.warning({
        title: `Llegaste ${data.minutosTardanza} min tarde`,
        description: `Entrada ${hhmm(data.horaProgramada)} · ingreso ${hhmm(
          data.horaIngreso,
        )}`,
        duration: null,
        button: { title: "Justificar", onClick: () => setModalOpen(true) },
      });
      setModalOpen(true);
    })();
    return () => {
      cancel = true;
    };
  }, []);

  if (!registro || !registro.tarde) return null;

  return (
    <TardanzaModal
      open={modalOpen}
      registro={registro}
      onClose={() => setModalOpen(false)}
      onDone={() => {
        setModalOpen(false);
        if (warnId.current) sileo.dismiss(warnId.current);
        setRegistro((r) => (r ? { ...r, estado: "Justificada" } : r));
        sileo.success({ title: "Tardanza justificada" });
      }}
    />
  );
}

function TardanzaModal({
  open,
  registro,
  onClose,
  onDone,
}: {
  open: boolean;
  registro: CheckIn;
  onClose: () => void;
  onDone: () => void;
}) {
  const [texto, setTexto] = useState("");
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (texto.trim().length < 5) return;
    setSaving(true);
    try {
      await crm.action(`asistencia/${registro.registroId}/justificar`, {
        texto: texto.trim(),
      });
      onDone();
    } catch (err) {
      setSaving(false);
      sileo.error({
        title: "No se pudo justificar",
        description: err instanceof Error ? err.message : "Inténtalo de nuevo",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-4 rounded-[1.75rem] bg-panel p-6 shadow-2xl"
      >
        <div>
          <h2 className="text-lg font-semibold text-ink">Justificar tardanza</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Registraste tu ingreso a las {hhmm(registro.horaIngreso)}, con{" "}
            <span className="font-semibold text-red-600">
              {registro.minutosTardanza} min
            </span>{" "}
            de retraso sobre tu hora de entrada ({hhmm(registro.horaProgramada)}).
          </p>
        </div>

        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={4}
          autoFocus
          required
          minLength={5}
          placeholder="Explica el motivo de la tardanza…"
          className="w-full rounded-2xl border border-neutral-200 px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/25"
        />

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full px-4 py-2 text-sm text-neutral-600 hover:bg-white"
          >
            Ahora no
          </button>
          <button
            type="submit"
            disabled={saving || texto.trim().length < 5}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white hover:brightness-95 disabled:opacity-60"
          >
            {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
            Enviar justificación
          </button>
        </div>
      </form>
    </div>
  );
}
