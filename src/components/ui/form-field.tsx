"use client";

import type { ComponentProps, ReactElement, ReactNode } from "react";
import { createElement, useId } from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "cn";

export interface FormFieldProps extends Omit<ComponentProps<"div">, "children"> {
  label: string;
  /** The single control. `FormField` wires `id`, `aria-invalid`, `aria-describedby`. */
  children: ReactElement;
  error?: string | null;
  hint?: ReactNode;
  required?: boolean;
}

/**
 * §5.5 form field — 13px semibold ink label with required star, optional hint,
 * and a red error line (icon + text). Error/hint ids auto-wire onto the control.
 */
export function FormField({
  label,
  children,
  error,
  hint,
  required = false,
  className,
  ...props
}: FormFieldProps) {
  const fieldId = useId();
  const descId = useId();
  const describedBy = error || hint ? descId : undefined;

  return (
    <div data-slot="form-field" className={cn("grid gap-1.5", className)} {...props}>
      <label htmlFor={fieldId} className="text-[13px] font-semibold text-ink-800">
        {label}
        {required && (
          <span aria-hidden="true" className="ml-0.5 text-red">
            *
          </span>
        )}
      </label>
      {hint && !error && (
        <p id={descId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      )}
      {renderLabeledControl(children, fieldId, descId, Boolean(error), describedBy)}
      {error && (
        <p
          id={descId}
          role="alert"
          className="flex items-center gap-1 text-xs font-medium text-red"
        >
          <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" strokeWidth={2.2} />
          {error}
        </p>
      )}
    </div>
  );
}

/** Clones the control, injecting id + a11y props (explicit id is kept). */
function renderLabeledControl(
  control: ReactElement,
  fieldId: string,
  _descId: string,
  invalid: boolean,
  describedBy?: string,
): ReactElement {
  const original = control.props as {
    id?: string;
    children?: ReactNode;
    [key: string]: unknown;
  };
  const props = {
    ...original,
    id: original.id ?? fieldId,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
  };
  return createElement(control.type, props, original.children);
}
