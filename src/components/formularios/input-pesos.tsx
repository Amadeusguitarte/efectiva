"use client";

import { useLayoutEffect, useRef } from "react";

import { Input } from "@/components/ui/input";
import { formatearNumero } from "@/lib/formato";
import { cn } from "cn";

type InputPesosProps = Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange" | "type" | "inputMode"
> & {
  valor: number | null;
  onCambio: (valor: number | null) => void;
};

const MAXIMO_DIGITOS = 12;
const soloDigitos = (texto: string) => texto.replace(/\D/g, "");
const esDigito = (caracter: string | undefined) => caracter !== undefined && /\d/.test(caracter);

/**
 * Importe en pesos: muestra separadores de miles mientras se escribe y entrega un número
 * entero (o null cuando está vacío). No admite decimales: honorarios y deudas se manejan en
 * pesos completos. Conserva la posición del cursor aunque cambien los separadores.
 */
export function InputPesos({ valor, onCambio, className, ...props }: InputPesosProps) {
  const ref = useRef<HTMLInputElement>(null);
  // Dígitos a la izquierda del cursor antes del cambio; se restaura tras renderizar.
  const digitosAntesDelCursor = useRef<number | null>(null);

  useLayoutEffect(() => {
    const input = ref.current;
    const objetivo = digitosAntesDelCursor.current;
    if (!input || objetivo === null) return;
    digitosAntesDelCursor.current = null;
    let posicion = 0;
    let vistos = 0;
    while (posicion < input.value.length && vistos < objetivo) {
      if (esDigito(input.value[posicion])) vistos += 1;
      posicion += 1;
    }
    input.setSelectionRange(posicion, posicion);
  }, [valor]);

  function aplicar(digitos: string, digitosIzquierda: number) {
    const recortados = digitos.slice(0, MAXIMO_DIGITOS);
    digitosAntesDelCursor.current = Math.min(digitosIzquierda, recortados.length);
    onCambio(recortados === "" ? null : Number(recortados));
  }

  return (
    <div className="relative">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground"
      >
        $
      </span>
      <Input
        {...props}
        ref={ref}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={valor === null ? "" : formatearNumero(valor)}
        onChange={(evento) => {
          const texto = evento.target.value;
          const cursor = evento.target.selectionStart ?? texto.length;
          aplicar(soloDigitos(texto), soloDigitos(texto.slice(0, cursor)).length);
        }}
        onKeyDown={(evento) => {
          // Retroceso sobre un separador: borra el dígito anterior al separador.
          if (evento.key !== "Backspace") return;
          const input = evento.currentTarget;
          const inicio = input.selectionStart;
          if (inicio === null || inicio !== input.selectionEnd || inicio === 0) return;
          if (esDigito(input.value[inicio - 1])) return;
          evento.preventDefault();
          const izquierda = soloDigitos(input.value.slice(0, inicio)).length;
          const digitos = soloDigitos(input.value);
          aplicar(digitos.slice(0, izquierda - 1) + digitos.slice(izquierda), izquierda - 1);
        }}
        className={cn("pl-7 text-right tabular-nums", className)}
      />
    </div>
  );
}
